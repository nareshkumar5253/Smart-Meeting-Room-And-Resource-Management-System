import { useEffect, useState } from "react";
import axios from "axios";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000";

interface DashboardOverview {
  upcoming_meetings: number;
  available_rooms: number;
  total_rooms: number;
  total_resources: number;
  active_bookings: number;
}

interface UpcomingMeeting {
  booking_id: number;
  title: string;
  room_id: number;
  start_datetime: string;
  end_datetime: string;
  status: string;
}

interface AvailableRoom {
  id: number;
  name: string;
  room_code: string;
  location: string | null;
  capacity: number;
  facilities: string | null;
}

function Dashboard() {
  const navigate = useNavigate();

  const [overview, setOverview] =
    useState<DashboardOverview | null>(null);

  const [upcomingMeetings, setUpcomingMeetings] =
    useState<UpcomingMeeting[]>([]);

  const [availableRooms, setAvailableRooms] =
    useState<AvailableRoom[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // FETCH DASHBOARD DATA
  // ============================================================

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        overviewResponse,
        meetingsResponse,
        roomsResponse,
      ] = await Promise.all([
        axios.get<DashboardOverview>(
          `${API_BASE_URL}/dashboard/overview`,
          { headers }
        ),

        axios.get<UpcomingMeeting[]>(
          `${API_BASE_URL}/dashboard/upcoming-meetings`,
          { headers }
        ),

        axios.get<AvailableRoom[]>(
          `${API_BASE_URL}/dashboard/available-rooms`,
          { headers }
        ),
      ]);

      setOverview(overviewResponse.data);

      setUpcomingMeetings(
        Array.isArray(meetingsResponse.data)
          ? meetingsResponse.data
          : []
      );

      setAvailableRooms(
        Array.isArray(roomsResponse.data)
          ? roomsResponse.data
          : []
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          localStorage.removeItem("access_token");
          window.location.href = "/";
          return;
        }

        setError(
          err.response?.data?.detail ||
            "Unable to load dashboard data."
        );
      } else {
        setError("Unable to load dashboard data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (value: string) => {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = (value: string) => {
    return new Date(value).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress size={42} />
      </Box>
    );
  }

  // ============================================================
  // DASHBOARD
  // ============================================================

  return (
    <Box>
      {/* ========================================================
          HEADER
      ======================================================== */}

      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <DashboardOutlinedIcon color="primary" />

            <Typography
              variant="overline"
              color="primary"
              fontWeight={700}
              letterSpacing={1.2}
            >
              SMART MEETING ROOM
            </Typography>
          </Stack>

          <Typography
            variant="h3"
            fontWeight={800}
            sx={{
              fontSize: {
                xs: "2rem",
                md: "2.6rem",
              },
            }}
          >
            Dashboard
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Manage meetings, rooms, resources, and daily operations
            from one place.
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1.5}
        >
          <Button
            variant="outlined"
            startIcon={<MeetingRoomOutlinedIcon />}
            onClick={() => navigate("/meeting-rooms")}
          >
            View Rooms
          </Button>

          <Button
            variant="contained"
            startIcon={<CalendarMonthOutlinedIcon />}
            onClick={() => navigate("/bookings")}
          >
            View Bookings
          </Button>
        </Stack>
      </Box>

      {/* ========================================================
          ERROR
      ======================================================== */}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* ========================================================
          STATISTICS
      ======================================================== */}

      <Grid container spacing={2.5}>
        {/* ======================================================
            UPCOMING MEETINGS
        ====================================================== */}

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              background:
                "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
              color: "#fff",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.85 }}
                  >
                    Upcoming Meetings
                  </Typography>

                  <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{ mt: 1 }}
                  >
                    {overview?.upcoming_meetings ?? 0}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ mt: 1, opacity: 0.85 }}
                  >
                    Scheduled meetings ahead
                  </Typography>
                </Box>

                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      "rgba(255,255,255,0.18)",
                  }}
                >
                  <EventAvailableOutlinedIcon />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ======================================================
            AVAILABLE ROOMS
        ====================================================== */}

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              background:
                "linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)",
              color: "#fff",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.85 }}
                  >
                    Available Rooms
                  </Typography>

                  <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{ mt: 1 }}
                  >
                    {overview?.available_rooms ?? 0}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ mt: 1, opacity: 0.85 }}
                  >
                    Ready for booking
                  </Typography>
                </Box>

                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      "rgba(255,255,255,0.18)",
                  }}
                >
                  <MeetingRoomOutlinedIcon />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ======================================================
            RESOURCES
        ====================================================== */}

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              background:
                "linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)",
              color: "#fff",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.85 }}
                  >
                    Total Resources
                  </Typography>

                  <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{ mt: 1 }}
                  >
                    {overview?.total_resources ?? 0}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ mt: 1, opacity: 0.85 }}
                  >
                    Office resources
                  </Typography>
                </Box>

                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      "rgba(255,255,255,0.18)",
                  }}
                >
                  <Inventory2OutlinedIcon />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ======================================================
            ACTIVE BOOKINGS
        ====================================================== */}

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              background:
                "linear-gradient(135deg, #7b1fa2 0%, #ab47bc 100%)",
              color: "#fff",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.85 }}
                  >
                    Active Bookings
                  </Typography>

                  <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{ mt: 1 }}
                  >
                    {overview?.active_bookings ?? 0}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ mt: 1, opacity: 0.85 }}
                  >
                    Current active reservations
                  </Typography>
                </Box>

                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      "rgba(255,255,255,0.18)",
                  }}
                >
                  <CalendarMonthOutlinedIcon />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ======================================================
            UPCOMING MEETINGS
        ====================================================== */}

        <Grid size={{ xs: 12, lg: 7 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    Upcoming Meetings
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Your next scheduled meetings
                  </Typography>
                </Box>

                <Button
                  size="small"
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={() => navigate("/bookings")}
                >
                  View All
                </Button>
              </Box>

              <Divider />

              {upcomingMeetings.length === 0 ? (
                <Box
                  sx={{
                    py: 5,
                    textAlign: "center",
                  }}
                >
                  <Typography color="text.secondary">
                    No upcoming meetings found.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {upcomingMeetings
                    .slice(0, 5)
                    .map((meeting, index) => (
                      <Box key={meeting.booking_id}>
                        <ListItem
                          disableGutters
                          sx={{
                            py: 2,
                            alignItems: "flex-start",
                          }}
                        >
                          {/* MEETING ICON */}

                          <Box
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: 2.5,
                              backgroundColor: "#eaf2ff",
                              color: "primary.main",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              mr: 2,
                              flexShrink: 0,
                            }}
                          >
                            <CalendarMonthOutlinedIcon fontSize="small" />
                          </Box>

                          {/* MEETING DETAILS */}

                          <Box
                            sx={{
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              fontWeight={700}
                              sx={{ mb: 0.5 }}
                            >
                              {meeting.title}
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              Room {meeting.room_id}
                            </Typography>

                            <Stack
                              direction={{
                                xs: "column",
                                sm: "row",
                              }}
                              spacing={{
                                xs: 0.3,
                                sm: 2,
                              }}
                              sx={{ mt: 0.5 }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {formatDate(
                                  meeting.start_datetime
                                )}
                              </Typography>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {formatTime(
                                  meeting.start_datetime
                                )}{" "}
                                -{" "}
                                {formatTime(
                                  meeting.end_datetime
                                )}
                              </Typography>
                            </Stack>
                          </Box>

                          {/* STATUS */}

                          <Chip
                            label={meeting.status}
                            color={
                              meeting.status === "CONFIRMED"
                                ? "success"
                                : "default"
                            }
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </ListItem>

                        {index <
                          Math.min(
                            upcomingMeetings.length,
                            5
                          ) -
                            1 && <Divider />}
                      </Box>
                    ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ======================================================
            AVAILABLE ROOMS
        ====================================================== */}

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    Available Rooms
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Rooms currently available
                  </Typography>
                </Box>

                <Button
                  size="small"
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={() =>
                    navigate("/meeting-rooms")
                  }
                >
                  View All
                </Button>
              </Box>

              <Divider />

              {availableRooms.length === 0 ? (
                <Box
                  sx={{
                    py: 5,
                    textAlign: "center",
                  }}
                >
                  <Typography color="text.secondary">
                    No available rooms found.
                  </Typography>
                </Box>
              ) : (
                <Stack
                  spacing={2}
                  sx={{ mt: 2 }}
                >
                  {availableRooms
                    .slice(0, 4)
                    .map((room) => (
                      <Box
                        key={room.id}
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          backgroundColor: "#f8fafc",
                          border: "1px solid",
                          borderColor: "#e5e7eb",
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          gap={2}
                        >
                          <Box>
                            <Typography
                              fontWeight={700}
                              sx={{ mb: 0.5 }}
                            >
                              {room.name}
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {room.room_code}
                            </Typography>

                            <Stack
                              direction="row"
                              spacing={1.5}
                              sx={{
                                mt: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                              >
                                <GroupsOutlinedIcon
                                  sx={{
                                    fontSize: 16,
                                    color:
                                      "text.secondary",
                                  }}
                                />

                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {room.capacity} people
                                </Typography>
                              </Stack>

                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                              >
                                <MeetingRoomOutlinedIcon
                                  sx={{
                                    fontSize: 16,
                                    color:
                                      "text.secondary",
                                  }}
                                />

                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {room.location ||
                                    "Location not set"}
                                </Typography>
                              </Stack>
                            </Stack>
                          </Box>

                          <Chip
                            label="Available"
                            color="success"
                            size="small"
                          />
                        </Stack>
                      </Box>
                    ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ======================================================
            QUICK ACTIONS
        ====================================================== */}

        <Grid size={{ xs: 12 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                gutterBottom
              >
                Quick Actions
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Quickly access the most-used areas of the
                system.
              </Typography>

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1.5}
              >
                <Button
                  variant="contained"
                  startIcon={
                    <CalendarMonthOutlinedIcon />
                  }
                  onClick={() =>
                    navigate("/bookings")
                  }
                >
                  Manage Bookings
                </Button>

                <Button
                  variant="outlined"
                  startIcon={
                    <MeetingRoomOutlinedIcon />
                  }
                  onClick={() =>
                    navigate("/meeting-rooms")
                  }
                >
                  Browse Rooms
                </Button>

                <Button
                  variant="outlined"
                  startIcon={
                    <Inventory2OutlinedIcon />
                  }
                  onClick={() =>
                    navigate("/resources")
                  }
                >
                  View Resources
                </Button>

                <Button
                  variant="outlined"
                  startIcon={
                    <AccessTimeOutlinedIcon />
                  }
                  onClick={() =>
                    navigate("/reports")
                  }
                >
                  View Reports
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;