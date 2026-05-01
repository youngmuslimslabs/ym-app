import { getPeoplePageData } from './data'
import { PeoplePageClient } from './PeoplePageClient'

export default async function PeoplePage() {
  const { people, filterCategories } = await getPeoplePageData()

  return (
    <PeoplePageClient
      initialPeople={people}
      filterCategories={filterCategories}
    />
  )
}
