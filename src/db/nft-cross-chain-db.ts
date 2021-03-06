import { JSONFile } from "@commonify/lowdb";

import { IParsedTransfer } from "@jccdex/grid-protocol/lib/types/transaction";
import { string2json } from "@jccdex/grid-protocol/lib/util";
import LowWithLodash from "./low";
import { ICrossChainTable, ICrossChainDate } from "../types/db";
import { IDepositMemo, IWithdrawMemo } from "../types/memo";

export class NFTDateDB {
  protected adapter;
  public db: LowWithLodash<ICrossChainDate>;

  constructor(file: string) {
    this.adapter = new JSONFile(file);
    this.db = new LowWithLodash<ICrossChainDate>(this.adapter);
  }

  public initData() {
    this.db.data = Object.assign(
      {
        latest: null
      },
      this.db.data
    );
  }

  public async read() {
    await this.db.read();
    this.initData();
  }

  public updateLatest(value: string) {
    this.db.data.latest = value;
  }

  public getDate(): string | null {
    return this.db.chain.get("latest").value();
  }

  async write() {
    await this.db.write();
  }
}

export default class NFTCrossChainDB {
  public db: LowWithLodash<ICrossChainTable>;

  protected adapter;
  constructor(file: string) {
    this.adapter = new JSONFile(file);
    this.db = new LowWithLodash<ICrossChainTable>(this.adapter);
  }

  public initData() {
    this.db.data = Object.assign(
      {
        orders: [],
        executedOrders: [],
        canceledOrders: []
      },
      this.db.data
    );
  }

  public insertOrders(txs: IParsedTransfer[]) {
    this.insert("orders", txs);
  }

  public insertExecutedOrders(txs: IParsedTransfer[]) {
    this.insert("executedOrders", txs);
  }

  public insertCanceledOrders(txs: IParsedTransfer[]) {
    this.insert("canceledOrders", txs);
  }

  public findDepositExecutedOrder(order: IDepositMemo) {
    const data = this.db.chain
      .get("executedOrders")
      .find((o) => {
        const memo = o.memo;
        const { fromChain, toChain, from, to, nft, id, depositHash } = order || {};
        return (
          memo.fromChain === fromChain &&
          memo.toChain === toChain &&
          memo.from.toLowerCase() === from.toLowerCase() &&
          memo.to.toLowerCase() === to.toLowerCase() &&
          memo.nft.toLowerCase() === nft.toLowerCase() &&
          memo.id === id &&
          memo.depositHash.toLowerCase() === depositHash.toLowerCase()
        );
      })
      .value();

    return data;
  }

  public findDepositCanceledOrder(order: IDepositMemo) {
    const data = this.db.chain
      .get("canceledOrders")
      .find((o) => {
        const memo = o.memo;
        const { fromChain, toChain, from, to, nft, id, depositHash } = order || {};
        return (
          memo.fromChain === fromChain &&
          memo.toChain === toChain &&
          memo.from.toLowerCase() === from.toLowerCase() &&
          memo.to.toLowerCase() === to.toLowerCase() &&
          memo.nft.toLowerCase() === nft.toLowerCase() &&
          memo.id === id &&
          memo.depositHash.toLowerCase() === depositHash.toLowerCase()
        );
      })
      .value();

    return data;
  }

  public findWithdrawExecutedOrder(order: IWithdrawMemo) {
    const data = this.db.chain
      .get("executedOrders")
      .find((o) => {
        const memo = o.memo || {};
        const { fromChain, toChain, from, to, publisher, id, fundCode, depositHash } = order || {};
        return (
          memo.fromChain === fromChain &&
          memo.toChain === toChain &&
          memo.from.toLowerCase() === from.toLowerCase() &&
          memo.to.toLowerCase() === to.toLowerCase() &&
          memo.publisher.toLowerCase() === publisher.toLowerCase() &&
          memo.id === id &&
          memo.fundCode === fundCode &&
          memo.depositHash.toLowerCase() === depositHash.toLowerCase()
        );
      })
      .value();

    return data;
  }

  public findWithdrawCanceledOrder(order: IWithdrawMemo) {
    const data = this.db.chain
      .get("canceledOrders")
      .find((o) => {
        const memo = o.memo;
        const { fromChain, toChain, from, to, publisher, id, fundCode, depositHash } = order || {};
        return (
          memo.fromChain === fromChain &&
          memo.toChain === toChain &&
          memo.from.toLowerCase() === from.toLowerCase() &&
          memo.to.toLowerCase() === to.toLowerCase() &&
          memo.publisher.toLowerCase() === publisher.toLowerCase() &&
          memo.id === id &&
          memo.fundCode === fundCode &&
          memo.depositHash.toLowerCase() === depositHash.toLowerCase()
        );
      })
      .value();

    return data;
  }

  async write() {
    await this.db.write();
  }

  public async read() {
    await this.db.read();
    this.initData();
  }

  protected insert(action: string, txs: IParsedTransfer[]) {
    const actions = this.db.chain.get(action);
    const value = actions.value();
    for (const tx of txs) {
      const data = actions.find({ hash: tx.hash }).value();

      if (!data) {
        tx.memo = string2json(tx.memo);
        value.push(tx);
      }
    }
  }
}
