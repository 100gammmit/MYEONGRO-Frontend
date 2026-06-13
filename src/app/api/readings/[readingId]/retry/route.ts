import { createReadingRetryHandler } from "@/app/api/readings/records-handler";
import { createRecordRouteDependencies } from "@/app/api/readings/record-route-dependencies";

type RouteContext = {
  params: Promise<{ readingId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  return createReadingRetryHandler(createRecordRouteDependencies())(request, context);
}
