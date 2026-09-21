import { HttpError, type PageProps } from "fresh";
import { Head } from "fresh/runtime";

export default function ErrorPage({ error }: PageProps) {
  const notFound = error instanceof HttpError && error.status === 404;
  return (
    <section class="not-found">
      <Head>
        <title>{notFound ? "Not found" : "Error"} · URPS Fellowship Curriculum</title>
      </Head>
      <h1>{notFound ? "Page not found" : "Something went wrong"}</h1>
      <p>
        {notFound ? "There's no page at this address." : "The page failed to load."} <a href="/">Back to the curriculum</a>
      </p>
    </section>
  );
}
