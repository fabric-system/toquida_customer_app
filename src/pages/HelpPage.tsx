export function HelpPage() {
  return (
    <div className="page page--padded">
      <h1 className="page-title">Help</h1>
      <section className="card">
        <h2 className="card-title">Create account</h2>
        <p className="fineprint">
          Tap Create account on the welcome screen, enter your email and password, and accept the
          terms. You can use the app right away; credits start at zero until you top up at a kiosk.
        </p>
      </section>
      <section className="card">
        <h2 className="card-title">Top-up (kiosk only for now)</h2>
        <p className="fineprint">
          In-app top-up is not available yet. Add credits using the coin machine at the carwash
          kiosk. Your balance in this app updates when the site syncs with the central backend.
        </p>
      </section>
      <section className="card">
        <h2 className="card-title">Face & tag at kiosk</h2>
        <p className="fineprint">
          Enroll your face in this app first. You will receive a claim code — use it at the carwash
          kiosk when you are ready. The kiosk links your RFID tag and dispenses it; this app does not
          control hardware.
        </p>
      </section>
      <section className="card">
        <h2 className="card-title">Balance</h2>
        <p className="fineprint">
          The amount shown comes from the central backend. If it looks wrong after a top-up, wait a
          moment for sync or ask staff — the app does not read the coin machine directly.
        </p>
      </section>
      <section className="card">
        <h2 className="card-title">Support</h2>
        <p className="muted fineprint">Support channel TBD (phone/chat) once operations go live.</p>
      </section>
    </div>
  );
}
