import { SuccessPageClient } from "@/components/success-page-client"

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ formType: string; submissionId: string }>
}) {
  const { formType, submissionId } = await params

  return <SuccessPageClient formType={formType} submissionId={submissionId} />
}
