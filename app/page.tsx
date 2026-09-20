import WaitlistForm from "@/components/WaitlistForm";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">Threadline</p>
        <h1>Turn scattered feedback into a clear next step.</h1>
        <p className="hero-copy">
          Threadline gives product teams one practical place to gather feedback, find patterns, and decide what to build next.
        </p>
        <WaitlistForm />
      </section>

      <section className="benefits" aria-labelledby="benefits-heading">
        <p className="eyebrow">A calmer way to decide</p>
        <h2 id="benefits-heading">Less sorting. Better conversations.</h2>
        <div className="benefit-list">
          <article>
            <h3>See the signal</h3>
            <p>Bring customer notes and team ideas together so repeated needs are easy to spot.</p>
          </article>
          <article>
            <h3>Make the tradeoff</h3>
            <p>Give every request enough context to compare it with the work already in motion.</p>
          </article>
          <article>
            <h3>Keep momentum</h3>
            <p>Turn a thoughtful decision into a shared next step your team can act on.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
