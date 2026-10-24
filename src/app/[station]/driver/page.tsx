import { Suspense } from "react";
import { DriverApp } from "../../../components/driver/DriverApp";
import { getStation } from "../../../lib/stations";

type PageProps = { params: Promise<{ station: string }> };

async function Resolved({ params }: PageProps) {
  const { station: slug } = await params;
  return <DriverApp station={getStation(slug)} />;
}

export default function DriverPage(props: PageProps) {
  return (
    <Suspense fallback={null}>
      <Resolved {...props} />
    </Suspense>
  );
}
