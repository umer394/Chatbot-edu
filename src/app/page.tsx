
import { cookies } from "next/headers"

export default async function home(){
  const cookieStore = await cookies()
  const data = cookieStore.get('user_data')
  return (
    <div>
      {/* {data?.value} */}
      Hello
    </div>
  )
}