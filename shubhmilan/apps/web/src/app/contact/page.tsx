export const metadata = { title: 'Contact' };

export default function Contact() {
  return (
    <main className="container section">
      <h1>Contact us</h1>
      <p>For any questions or partnership inquiries:</p>
      <ul style={{ lineHeight: 2 }}>
        <li>
          Email: <a href="mailto:support@tenderfy.org">support@tenderfy.org</a>
        </li>
        <li>Hours: 10:00 – 19:00 IST, Mon – Sat</li>
      </ul>
      <h2>Media &amp; partnerships</h2>
      <p>Please include your organization and intent in the subject line so we can route quickly.</p>
    </main>
  );
}
