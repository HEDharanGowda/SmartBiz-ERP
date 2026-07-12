import type { SalesModel, Customer, Invoice, InvoiceItem, Payment } from './models.js';

export class SalesService {
  constructor(private model: SalesModel) {}

  async createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    return this.model.createCustomer(data);
  }

  async listCustomers(companyId: string): Promise<Customer[]> {
    return this.model.findCustomers(companyId);
  }

  calculateInvoiceAmounts(items: InvoiceItem[], gstRate: number) {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = (subtotal * gstRate) / 100;
    const total = subtotal + gstAmount;
    return { subtotal, gstAmount, total };
  }

  async createInvoice(data: {
    customerId: string;
    companyId: string;
    items: InvoiceItem[];
    gstRate: number;
    dueDate: string;
    createdBy: string;
  }): Promise<Invoice> {
    const { subtotal, gstAmount, total } = this.calculateInvoiceAmounts(data.items, data.gstRate);

    return this.model.createInvoice({
      customerId: data.customerId,
      companyId: data.companyId,
      items: data.items,
      subtotal,
      gstAmount,
      total,
      status: 'Unpaid',
      dueDate: data.dueDate,
      createdBy: data.createdBy
    });
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    return this.model.findInvoiceById(id);
  }

  async listInvoices(companyId: string, status?: string): Promise<Invoice[]> {
    return this.model.findInvoices(companyId, status);
  }

  async recordPayment(data: {
    invoiceId: string;
    companyId: string;
    amount: number;
    paymentMethod: string;
    reference?: string;
    createdBy: string;
  }): Promise<Payment> {
    const invoice = await this.model.findInvoiceById(data.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const payment = await this.model.createPayment(data);
    const payments = await this.model.getPayments(data.invoiceId);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    let status: 'Unpaid' | 'Partially_Paid' | 'Fully_Paid';
    if (totalPaid >= invoice.total) {
      status = 'Fully_Paid';
    } else if (totalPaid > 0) {
      status = 'Partially_Paid';
    } else {
      status = 'Unpaid';
    }

    await this.model.updateInvoice(data.invoiceId, { status });
    return payment;
  }

  async getPayments(invoiceId: string): Promise<Payment[]> {
    return this.model.getPayments(invoiceId);
  }

  async getTotalRevenue(companyId: string): Promise<number> {
    const invoices = await this.model.findInvoices(companyId, 'Fully_Paid');
    return invoices.reduce((sum, inv) => sum + inv.total, 0);
  }
}
