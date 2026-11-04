import { PageHeader } from '@/components/layout/page-header'
import { getFirstName } from '@/lib/utils/getFirstName'

export function Greeting({ fullName }: { fullName: string }) {
  return <PageHeader className="[&>div>div]:space-y-1 [&_h1]:leading-tight [&_p]:leading-tight" title={`Salaam, ${getFirstName(fullName)}`} description="Here is what is happening across your NeighborNet." />
}
