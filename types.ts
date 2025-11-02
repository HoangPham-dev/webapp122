export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id?: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  from: {
    name: string;
    address: string;
    email: string;
    logo?: string;
  };
  to: {
    name: string;
    address: string;
    email: string;
  };
  items: LineItem[];
  notes: string;
  taxRate: number;
  currency: string;
}