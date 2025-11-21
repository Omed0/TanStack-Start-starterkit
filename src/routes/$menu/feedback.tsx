import { FeedbackForm } from '@/components/restaurant/feedback-form'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$menu/feedback')({
    component: RouteComponent,
})

function RouteComponent() {
    const { menu } = Route.useParams()
    return <FeedbackForm slug={menu} />
}
