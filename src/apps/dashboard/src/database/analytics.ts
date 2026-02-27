import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import { api } from 'api/convex'

type TimePeriod = "today" | "week" | "month" | "year" | "all"
