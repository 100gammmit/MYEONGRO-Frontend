import {
  createReadingDeleteHandler,
  createReadingDetailHandler,
} from "@/app/api/readings/records-handler";
import { createRecordRouteDependencies } from "@/app/api/readings/record-route-dependencies";

type RouteContext = {
  params: Promise<{ readingId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  return createReadingDetailHandler(createRecordRouteDependencies())(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return createReadingDeleteHandler(createRecordRouteDependencies())(request, context);
}
