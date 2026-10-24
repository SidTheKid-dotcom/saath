import { Suspense } from "react";
import { RiderApp } from "../../components/rider/RiderApp";
import { getStation } from "../../lib/stations";

type PageProps = {
  params: Promise<{ station: string }>;
};

async function Resolved({ params }: PageProps) {
  const { station: slug } = await params;
  return <RiderApp station={getStation(slug)} />;
}

export default function StationPage(props: PageProps) {
  return (
    <Suspense fallback={null}>
      <Resolved {...props} />
    </Suspense>
  );
}
