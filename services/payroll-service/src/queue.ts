import amqp from 'amqplib';
import type { PayrollService } from './services.js';

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
const PAYROLL_QUEUE = 'payroll_processing';

export type PayrollJob = {
  employeeId: string;
  companyId: string;
  month: string;
  baseSalary: number;
  bonuses?: number;
  deductions?: number;
  workingDays: number;
  absentDays: number;
};

export class PayrollQueue {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  async connect() {
    this.connection = await amqp.connect(RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(PAYROLL_QUEUE, { durable: true });
    console.log('PayrollQueue connected to RabbitMQ');
  }

  async enqueue(job: PayrollJob) {
    if (!this.channel) {
      throw new Error('Queue not connected');
    }

    this.channel.sendToQueue(
      PAYROLL_QUEUE,
      Buffer.from(JSON.stringify(job)),
      { persistent: true }
    );
    console.log('Payroll job enqueued:', job.employeeId, job.month);
  }

  async startWorker(payrollService: PayrollService) {
    if (!this.channel) {
      throw new Error('Queue not connected');
    }

    this.channel.prefetch(1);
    console.log('Payroll worker started, waiting for jobs...');

    this.channel.consume(PAYROLL_QUEUE, async (msg) => {
      if (!msg) return;

      try {
        const job: PayrollJob = JSON.parse(msg.content.toString());
        console.log('Processing payroll job:', job.employeeId, job.month);

        await payrollService.processPayroll(job);
        this.channel!.ack(msg);
        console.log('Payroll job completed:', job.employeeId, job.month);
      } catch (error) {
        console.error('Payroll job failed:', error);
        this.channel!.nack(msg, false, false);
      }
    });
  }

  async close() {
    await this.channel?.close();
    await this.connection?.close();
  }
}
