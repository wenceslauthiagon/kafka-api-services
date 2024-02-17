export class Item {
  id: string;
  value: number;
  quantity: number;
  description: string;
  discount?: number;
  taxAmount?: number;
  amountExcludingTax?: number;
  amountIncludingTax?: number;
}
