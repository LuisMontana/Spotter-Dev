from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import TripRequestSerializer
from .routing import geocode, get_route, RoutingError
from .hos_engine import plan_trip, split_into_daily_logs


class PlanTripView(APIView):
    """
    POST /api/plan-trip/

    Body:
        {
            "current_location": "Denver, CO",
            "pickup_location": "Dallas, TX",
            "dropoff_location": "Chicago, IL",
            "current_cycle_used": 20
        }

    Returns route geometry/stats plus a day-by-day ELD log timeline.
    """

    def post(self, request):
        serializer = TripRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            current_coords = geocode(data["current_location"])
            pickup_coords = geocode(data["pickup_location"])
            dropoff_coords = geocode(data["dropoff_location"])

            deadhead = get_route([current_coords, pickup_coords])
            loaded = get_route([pickup_coords, dropoff_coords])
        except RoutingError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        segments = plan_trip(
            pickup_location=data["pickup_location"],
            dropoff_location=data["dropoff_location"],
            current_cycle_used_hours=data["current_cycle_used"],
            deadhead_miles=deadhead["distance_miles"],
            deadhead_hours=deadhead["duration_hours"],
            loaded_miles=loaded["distance_miles"],
            loaded_hours=loaded["duration_hours"],
        )
        daily_logs = split_into_daily_logs(segments)

        total_drive_hours = sum(s.duration_hours for s in segments if s.status == "driving")
        total_miles = deadhead["distance_miles"] + loaded["distance_miles"]

        return Response(
            {
                "route": {
                    "current_location": {
                        "name": data["current_location"],
                        "coordinates": current_coords,
                    },
                    "pickup_location": {
                        "name": data["pickup_location"],
                        "coordinates": pickup_coords,
                    },
                    "dropoff_location": {
                        "name": data["dropoff_location"],
                        "coordinates": dropoff_coords,
                    },
                    "deadhead_geometry": deadhead["geometry"],
                    "loaded_geometry": loaded["geometry"],
                    "total_distance_miles": round(total_miles, 1),
                    "total_drive_hours": round(total_drive_hours, 2),
                },
                "daily_logs": daily_logs,
            }
        )
