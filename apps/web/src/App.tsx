const modules = [
  'Auth',
  'Organization',
  'Employee',
  'Attendance',
  'Payroll',
  'Inventory',
  'Sales',
  'Finance',
  'Notifications',
  'Dashboard'
];

export default function App() {
  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">SmartBiz ERP</p>
          <h1>Microservices for a 50-person business, with the right datastore per domain.</h1>
          <p className="lede">
            Node.js services, a React operations console, PostgreSQL for transactions, MongoDB for flexible documents,
            Redis for sessions and cache, Kafka for events, and RabbitMQ for queued work.
          </p>
        </div>
        <aside className="statusCard">
          <span>Architecture</span>
          <strong>Gateway + 10 domain services</strong>
          <ul>
            <li>REST synchronous APIs</li>
            <li>Event-driven async flows</li>
            <li>Container-ready deployment</li>
          </ul>
        </aside>
      </section>

      <section className="grid">
        {modules.map((module) => (
          <article key={module} className="card">
            <span>{module}</span>
            <p>
              {module === 'Auth' && 'JWT, refresh tokens, OTP, session cache, and password reset flows.'}
              {module === 'Organization' && 'Company accounts, departments, and role assignment.'}
              {module === 'Employee' && 'Lifecycle records, documents, manager links, and salary history.'}
              {module === 'Attendance' && 'Check-in/out, leave, holidays, and late arrival rules.'}
              {module === 'Payroll' && 'Salary calculation, taxes, payslips, and processing events.'}
              {module === 'Inventory' && 'Products, stock, warehouses, vendors, and stock alerts.'}
              {module === 'Sales' && 'Customers, invoices, GST, payments, and revenue tracking.'}
              {module === 'Finance' && 'Income, expenses, profit, cash flow, and reports.'}
              {module === 'Notifications' && 'Email, in-app messages, preferences, and retry handling.'}
              {module === 'Dashboard' && 'CEO metrics, trends, and cached aggregate views.'}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}