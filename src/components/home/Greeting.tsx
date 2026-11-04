import { PageHeader } from '@/components/layout/page-header'
import { getFirstName } from '@/lib/utils/getFirstName'

export function Greeting({ fullName }: { fullName: string }) {
  return <PageHeader title={`Salaam, ${getFirstName(fullName)}`} description="Here is what is happening across your NeighborNet." />
}
