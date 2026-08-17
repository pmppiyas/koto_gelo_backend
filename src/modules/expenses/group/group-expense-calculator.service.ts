import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ParticipantInput,
  PayerInput,
} from '#app/modules/expenses/group/schemas/create-group-expense.schema.js';

export interface CalculatedParticipant {
  userId: string;
  shareAmount: number;
}

export interface CalculatedPayer {
  userId: string;
  amount: number;
}

export interface MemberBalanceInfo {
  userId: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  totalPaid: number;
  totalShare: number;
  netBalance: number;
}

export interface SettlementRecommendation {
  from: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
  to: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  };
  amount: number;
}

@Injectable()
export class GroupExpenseCalculatorService {
  calculatePayers(
    totalAmount: number,
    payers: PayerInput[] | undefined,
    defaultUserId: string,
  ): CalculatedPayer[] {
    if (!payers || payers.length === 0) {
      return [{ userId: defaultUserId, amount: Number(totalAmount.toFixed(2)) }];
    }

    const calculatedPayers: CalculatedPayer[] = payers.map((p) => ({
      userId: p.userId,
      amount: Number(p.amount.toFixed(2)),
    }));

    const totalPaid = Number(
      calculatedPayers.reduce((acc, p) => acc + p.amount, 0).toFixed(2),
    );

    if (Math.abs(totalPaid - totalAmount) > 0.01) {
      throw new BadRequestException(
        `Total paid amount (${totalPaid}) does not match total expense amount (${totalAmount})`,
      );
    }

    return calculatedPayers;
  }

  calculateSplits(
    totalAmount: number,
    splitType: 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES',
    participants: ParticipantInput[] | undefined,
    allGroupMemberUserIds: string[],
  ): CalculatedParticipant[] {
    const participantList: ParticipantInput[] =
      participants && participants.length > 0
        ? participants
        : allGroupMemberUserIds.map((userId) => ({ userId }));

    if (participantList.length === 0) {
      throw new BadRequestException(
        'At least one participant is required for splitting expense',
      );
    }

    const count = participantList.length;

    switch (splitType) {
      case 'EQUAL': {
        const baseShare = Math.floor((totalAmount / count) * 100) / 100;
        let remainder = Number(
          (totalAmount - baseShare * count).toFixed(2),
        );

        return participantList.map((p) => {
          let share = baseShare;
          if (remainder > 0.009) {
            share = Number((share + 0.01).toFixed(2));
            remainder = Number((remainder - 0.01).toFixed(2));
          }
          return {
            userId: p.userId,
            shareAmount: share,
          };
        });
      }

      case 'EXACT': {
        let totalExact = 0;
        const result: CalculatedParticipant[] = [];

        for (const p of participantList) {
          if (p.shareAmount === undefined || p.shareAmount <= 0) {
            throw new BadRequestException(
              `Exact share amount is required for user ${p.userId}`,
            );
          }
          const share = Number(p.shareAmount.toFixed(2));
          totalExact = Number((totalExact + share).toFixed(2));
          result.push({
            userId: p.userId,
            shareAmount: share,
          });
        }

        if (Math.abs(totalExact - totalAmount) > 0.01) {
          throw new BadRequestException(
            `Sum of exact shares (${totalExact}) does not equal total amount (${totalAmount})`,
          );
        }

        return result;
      }

      case 'PERCENTAGE': {
        let totalPercentage = 0;
        const rawShares: { userId: string; percent: number }[] = [];

        for (const p of participantList) {
          if (p.percentage === undefined || p.percentage <= 0) {
            throw new BadRequestException(
              `Percentage is required for user ${p.userId}`,
            );
          }
          totalPercentage = Number((totalPercentage + p.percentage).toFixed(2));
          rawShares.push({ userId: p.userId, percent: p.percentage });
        }

        if (Math.abs(totalPercentage - 100) > 0.01) {
          throw new BadRequestException(
            `Sum of percentages must equal 100% (currently ${totalPercentage}%)`,
          );
        }

        let calculatedSum = 0;
        const result = rawShares.map((p) => {
          const share = Number(((p.percent / 100) * totalAmount).toFixed(2));
          calculatedSum = Number((calculatedSum + share).toFixed(2));
          return { userId: p.userId, shareAmount: share };
        });

        const diff = Number((totalAmount - calculatedSum).toFixed(2));
        if (diff !== 0 && result.length > 0) {
          result[0].shareAmount = Number(
            (result[0].shareAmount + diff).toFixed(2),
          );
        }

        return result;
      }

      case 'SHARES': {
        let totalShares = 0;
        const rawList: { userId: string; shares: number }[] = [];

        for (const p of participantList) {
          const shares = p.shares && p.shares > 0 ? p.shares : 1;
          totalShares += shares;
          rawList.push({ userId: p.userId, shares });
        }

        let calculatedSum = 0;
        const result = rawList.map((p) => {
          const share = Number(
            ((p.shares / totalShares) * totalAmount).toFixed(2),
          );
          calculatedSum = Number((calculatedSum + share).toFixed(2));
          return { userId: p.userId, shareAmount: share };
        });

        const diff = Number((totalAmount - calculatedSum).toFixed(2));
        if (diff !== 0 && result.length > 0) {
          result[0].shareAmount = Number(
            (result[0].shareAmount + diff).toFixed(2),
          );
        }

        return result;
      }

      default:
        throw new BadRequestException(`Unsupported split type: ${splitType}`);
    }
  }

  calculateMemberBalances(
    members: Array<{
      id: string;
      username: string;
      name: string | null;
      avatarUrl: string | null;
    }>,
    expenses: Array<{
      payers: Array<{ userId: string; amount: any }>;
      participants: Array<{ userId: string; shareAmount: any }>;
    }>,
  ): MemberBalanceInfo[] {
    const balanceMap = new Map<
      string,
      { totalPaid: number; totalShare: number }
    >();

    for (const m of members) {
      balanceMap.set(m.id, { totalPaid: 0, totalShare: 0 });
    }

    for (const exp of expenses) {
      for (const payer of exp.payers) {
        const current = balanceMap.get(payer.userId) || {
          totalPaid: 0,
          totalShare: 0,
        };
        current.totalPaid = Number(
          (current.totalPaid + Number(payer.amount)).toFixed(2),
        );
        balanceMap.set(payer.userId, current);
      }

      for (const part of exp.participants) {
        const current = balanceMap.get(part.userId) || {
          totalPaid: 0,
          totalShare: 0,
        };
        current.totalShare = Number(
          (current.totalShare + Number(part.shareAmount)).toFixed(2),
        );
        balanceMap.set(part.userId, current);
      }
    }

    return members.map((m) => {
      const data = balanceMap.get(m.id) || { totalPaid: 0, totalShare: 0 };
      const net = Number((data.totalPaid - data.totalShare).toFixed(2));
      return {
        userId: m.id,
        username: m.username,
        name: m.name,
        avatarUrl: m.avatarUrl,
        totalPaid: data.totalPaid,
        totalShare: data.totalShare,
        netBalance: net,
      };
    });
  }

  calculateSettlements(
    balances: MemberBalanceInfo[],
  ): SettlementRecommendation[] {
    const userMap = new Map(
      balances.map((b) => [
        b.userId,
        {
          id: b.userId,
          username: b.username,
          name: b.name,
          avatarUrl: b.avatarUrl,
        },
      ]),
    );

    const debtors: { userId: string; amount: number }[] = [];
    const creditors: { userId: string; amount: number }[] = [];

    for (const b of balances) {
      if (b.netBalance < -0.009) {
        debtors.push({ userId: b.userId, amount: Math.abs(b.netBalance) });
      } else if (b.netBalance > 0.009) {
        creditors.push({ userId: b.userId, amount: b.netBalance });
      }
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const settlements: SettlementRecommendation[] = [];

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const settlementAmount = Math.min(debtor.amount, creditor.amount);
      const roundedAmount = Number(settlementAmount.toFixed(2));

      if (roundedAmount > 0) {
        settlements.push({
          from: userMap.get(debtor.userId)!,
          to: userMap.get(creditor.userId)!,
          amount: roundedAmount,
        });
      }

      debtor.amount = Number((debtor.amount - settlementAmount).toFixed(2));
      creditor.amount = Number((creditor.amount - settlementAmount).toFixed(2));

      if (debtor.amount < 0.01) {
        dIdx++;
      }
      if (creditor.amount < 0.01) {
        cIdx++;
      }
    }

    return settlements;
  }
}
