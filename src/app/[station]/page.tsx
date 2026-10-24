import { Suspense } from "react";
import { RiderApp, type Demo } from "../../components/rider/RiderApp";
import { getStation } from "../../lib/stations";

const DEMOS: Demo[] = ["confirm", "waiting", "group", "solo", "driver"];

type PageProps = {
  params: Promise<{ station: string }>;
  searchParams: Promise<{ demo?: string | string[] }>;
};

async function Resolved({ params, searchParams }: PageProps) {
  const { station: slug } = await params;
  const { demo: rawDemo } = await searchParams;
  const value = Array.isArray(rawDemo) ? rawDemo[0] : rawDemo;
  // Dev-only screenshot states, rendered from the mock api.
  const demo =
    process.env.NEXT_PUBLIC_USE_MOCK === "1" ? DEMOS.find((name) => name === value) : undefined;

  return <RiderApp station={getStation(slug)} demo={demo} />;
}

export default function StationPage(props: PageProps) {
  return (
    <Suspense fallback={null}>
      <Resolved {...props} />
    </Suspense>
  );
}
