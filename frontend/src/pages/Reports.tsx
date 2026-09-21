
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";

const API_BASE_URL = "http://127.0.0.1:8000";

const LOCAL_BOOKINGS_KEY =
  "meeting_room_bookings";

const FRONTEND_CANCELLED_BOOKINGS_KEY =
  "frontend_cancelled_bookings";

/* =========================================================
   BACKEND BOOKING
========================================================= */

interface BackendBooking {
  id: number;
  user_id: number;
  room_id: number;
  title: string;
  description: string | null;
  start_datetime: string;
  end_datetime: string;
  status: string;
  is_recurring: boolean;
  recurrence_rule: string | null;
  recurrence_end_date: string | null;
}

/* =========================================================
   FRONTEND / LOCAL BOOKING
========================================================= */

interface LocalBooking {
  id: string;
  room_id: number;
  room_name: string;
  room_code: string;
  location: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  notes: string;
  created_at: string;
}

/* =========================================================
   FRONTEND CANCELLATION
========================================================= */

interface FrontendCancelledBooking {
  id: string | number;
  room_id: number;
  title: string;
  description?: string | null;
  start_datetime: string;
  end_datetime: string;
  status: string;
  is_recurring?: boolean;
  recurrence_rule?: string | null;
  recurrence_end_date?: string | null;
  cancelled_at: string;
}

/* =========================================================
   COMMON BOOKING
========================================================= */

interface ReportBooking {
  id: string | number;
  room_id: number;
  title: string;
  description: string | null;
  start_datetime: string;
  end_datetime: string;
  status: string;
  is_recurring: boolean;
  recurrence_rule: string | null;
  recurrence_end_date: string | null;
  source: "backend" | "local" | "cancelled";
}

/* =========================================================
   PAGINATION
========================================================= */

interface BookingPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

interface BookingResponse {
  items: BackendBooking[];
  pagination?: BookingPagination;
}

/* =========================================================
   ROOM UTILIZATION
========================================================= */

interface RoomUtilization {
  room_id: number;
  room_name: string;
  booking_count: number;
  total_booked_hours: number;
  utilization_percentage: number;
}

/* =========================================================
   RESOURCE USAGE
========================================================= */

interface ResourceUsage {
  resource_id: number;
  resource_name: string;
  total_quantity_booked: number;
  booking_count: number;
}

/* =========================================================
   MONTHLY REPORT
========================================================= */

interface MonthlyReport {
  year: number;
  month: number;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  recurring_bookings: number;
  total_booked_hours: number;
}

/* =========================================================
   UPCOMING MEETING
========================================================= */

interface UpcomingMeeting {
  booking_id: string | number;
  title: string;
  room_id: number;
  start_datetime: string;
  end_datetime: string;
  status: string;
}

/* =========================================================
   COMPONENT
========================================================= */

function Reports() {
  const today = new Date();

  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const [roomUtilization, setRoomUtilization] =
    useState<RoomUtilization[]>([]);

  const [resourceUsage, setResourceUsage] =
    useState<ResourceUsage[]>([]);

  const [monthlyReport, setMonthlyReport] =
    useState<MonthlyReport | null>(null);

  const [upcomingMeetings, setUpcomingMeetings] =
    useState<UpcomingMeeting[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [exporting, setExporting] =
    useState<"excel" | "pdf" | null>(null);

  const [error, setError] =
    useState("");

  /* =========================================================
     READ LOCAL BOOKINGS
  ========================================================= */

  const getLocalBookings =
    (): ReportBooking[] => {
      try {
        const stored =
          localStorage.getItem(
            LOCAL_BOOKINGS_KEY
          );

        if (!stored) {
          return [];
        }

        const parsed =
          JSON.parse(stored);

        if (!Array.isArray(parsed)) {
          return [];
        }

        const bookings =
          parsed as LocalBooking[];

        return bookings.map(
          (booking) => ({
            id: booking.id,

            room_id:
              booking.room_id,

            title:
              booking.room_name ||
              "Meeting Room Booking",

            description:
              booking.notes || null,

            start_datetime:
              `${booking.booking_date}T${booking.start_time}:00`,

            end_datetime:
              `${booking.booking_date}T${booking.end_time}:00`,

            status:
              "CONFIRMED",

            is_recurring:
              false,

            recurrence_rule:
              null,

            recurrence_end_date:
              null,

            source:
              "local" as const,
          })
        );
      } catch (error) {
        console.error(
          "Unable to read local bookings:",
          error
        );

        return [];
      }
    };

  /* =========================================================
     READ FRONTEND CANCELLATIONS
  ========================================================= */

  const getFrontendCancelledBookings =
    (): ReportBooking[] => {
      try {
        const stored =
          localStorage.getItem(
            FRONTEND_CANCELLED_BOOKINGS_KEY
          );

        if (!stored) {
          return [];
        }

        const parsed =
          JSON.parse(stored);

        if (!Array.isArray(parsed)) {
          return [];
        }

        const bookings =
          parsed as FrontendCancelledBooking[];

        return bookings.map(
          (booking) => ({
            id: booking.id,

            room_id:
              booking.room_id,

            title:
              booking.title ||
              "Cancelled Booking",

            description:
              booking.description ||
              null,

            start_datetime:
              booking.start_datetime,

            end_datetime:
              booking.end_datetime,

            status:
              "CANCELLED",

            is_recurring:
              booking.is_recurring ??
              false,

            recurrence_rule:
              booking.recurrence_rule ??
              null,

            recurrence_end_date:
              booking.recurrence_end_date ??
              null,

            source:
              "cancelled" as const,
          })
        );
      } catch (error) {
        console.error(
          "Unable to read cancelled bookings:",
          error
        );

        return [];
      }
    };

  /* =========================================================
     CONVERT BACKEND BOOKINGS
  ========================================================= */

  const convertBackendBookings = (
    bookings: BackendBooking[]
  ): ReportBooking[] => {
    return bookings.map(
      (booking) => ({
        id: booking.id,

        room_id:
          booking.room_id,

        title:
          booking.title,

        description:
          booking.description,

        start_datetime:
          booking.start_datetime,

        end_datetime:
          booking.end_datetime,

        status:
          (
            booking.status ||
            "CONFIRMED"
          ).toUpperCase(),

        is_recurring:
          booking.is_recurring,

        recurrence_rule:
          booking.recurrence_rule,

        recurrence_end_date:
          booking.recurrence_end_date,

        source:
          "backend" as const,
      })
    );
  };

  /* =========================================================
     CHECK SELECTED MONTH
  ========================================================= */

  const isInSelectedMonth = (
    value: string
  ) => {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return false;
    }

    return (
      date.getFullYear() ===
        year &&
      date.getMonth() + 1 ===
        month
    );
  };

  /* =========================================================
     MERGE BOOKINGS
     
     Backend has priority when the same ID exists in
     both backend and local storage.
  ========================================================= */

  const mergeBookings = (
    backendBookings: ReportBooking[],
    localBookings: ReportBooking[],
    cancelledBookings: ReportBooking[]
  ): ReportBooking[] => {
    const map =
      new Map<
        string,
        ReportBooking
      >();

    /* ---------------------------------------------
       BACKEND FIRST
    --------------------------------------------- */

    backendBookings.forEach(
      (booking) => {
        map.set(
          String(booking.id),
          booking
        );
      }
    );

    /* ---------------------------------------------
       LOCAL BOOKINGS
       
       Only add local booking if it doesn't already
       exist in backend.
    --------------------------------------------- */

    localBookings.forEach(
      (booking) => {
        const id =
          String(booking.id);

        if (!map.has(id)) {
          map.set(
            id,
            booking
          );
        }
      }
    );

    /* ---------------------------------------------
       CANCELLED HISTORY
       
       Only add cancelled history when there is
       no current backend/local booking with that ID.
    --------------------------------------------- */

    cancelledBookings.forEach(
      (booking) => {
        const id =
          String(booking.id);

        if (!map.has(id)) {
          map.set(
            id,
            booking
          );
        }
      }
    );

    return Array.from(
      map.values()
    );
  };

  /* =========================================================
     CALCULATE MONTHLY SUMMARY
  ========================================================= */

  const calculateMonthlySummary = (
    allBookings: ReportBooking[]
  ): MonthlyReport => {
    const monthlyBookings =
      allBookings.filter(
        (booking) =>
          isInSelectedMonth(
            booking.start_datetime
          )
      );

    let confirmedBookings = 0;
    let cancelledBookings = 0;
    let recurringBookings = 0;
    let totalBookedHours = 0;

    monthlyBookings.forEach(
      (booking) => {
        const status =
          (
            booking.status ||
            ""
          ).toUpperCase();

        /* -----------------------------------------
           CONFIRMED / PENDING
        ----------------------------------------- */

        if (
          status === "CONFIRMED" ||
          status === "PENDING"
        ) {
          confirmedBookings +=
            1;
        }

        /* -----------------------------------------
           CANCELLED
        ----------------------------------------- */

        if (
          status === "CANCELLED"
        ) {
          cancelledBookings +=
            1;
        }

        /* -----------------------------------------
           RECURRING
        ----------------------------------------- */

        if (
          booking.is_recurring
        ) {
          recurringBookings +=
            1;
        }

        /* -----------------------------------------
           BOOKED HOURS
           
           Cancelled bookings are not counted in
           active booked hours.
        ----------------------------------------- */

        if (
          status !==
          "CANCELLED"
        ) {
          const start =
            new Date(
              booking.start_datetime
            ).getTime();

          const end =
            new Date(
              booking.end_datetime
            ).getTime();

          if (
            !Number.isNaN(start) &&
            !Number.isNaN(end) &&
            end > start
          ) {
            totalBookedHours +=
              (end - start) /
              (1000 * 60 * 60);
          }
        }
      }
    );

    return {
      year,
      month,

      total_bookings:
        confirmedBookings +
        cancelledBookings,

      confirmed_bookings:
        confirmedBookings,

      cancelled_bookings:
        cancelledBookings,

      recurring_bookings:
        recurringBookings,

      total_booked_hours:
        Number(
          totalBookedHours.toFixed(
            2
          )
        ),
    };
  };

  /* =========================================================
     CREATE UPCOMING MEETINGS
  ========================================================= */

  const createUpcomingMeetings =
    (
      backendUpcoming: UpcomingMeeting[],
      allBookings: ReportBooking[]
    ): UpcomingMeeting[] => {
      const now =
        new Date().getTime();

      const map =
        new Map<
          string,
          UpcomingMeeting
        >();

      /* ---------------------------------------------
         BACKEND UPCOMING
      --------------------------------------------- */

      backendUpcoming.forEach(
        (meeting) => {
          const start =
            new Date(
              meeting.start_datetime
            ).getTime();

          const status =
            (
              meeting.status ||
              ""
            ).toUpperCase();

          if (
            start > now &&
            status !== "CANCELLED"
          ) {
            map.set(
              String(
                meeting.booking_id
              ),
              {
                ...meeting,
                status,
              }
            );
          }
        }
      );

      /* ---------------------------------------------
         LOCAL + CURRENT BOOKINGS
      --------------------------------------------- */

      allBookings.forEach(
        (booking) => {
          const start =
            new Date(
              booking.start_datetime
            ).getTime();

          const status =
            (
              booking.status ||
              ""
            ).toUpperCase();

          if (
            start > now &&
            status !== "CANCELLED"
          ) {
            const id =
              String(
                booking.id
              );

            if (
              !map.has(id)
            ) {
              map.set(
                id,
                {
                  booking_id:
                    booking.id,

                  title:
                    booking.title,

                  room_id:
                    booking.room_id,

                  start_datetime:
                    booking.start_datetime,

                  end_datetime:
                    booking.end_datetime,

                  status,
                }
              );
            }
          }
        }
      );

      return Array.from(
        map.values()
      )
        .sort(
          (a, b) =>
            new Date(
              a.start_datetime
            ).getTime() -
            new Date(
              b.start_datetime
            ).getTime()
        )
        .slice(0, 20);
    };

  /* =========================================================
     FETCH REPORTS
  ========================================================= */

  const fetchReports =
    useCallback(
      async (
        showLoader = true
      ) => {
        try {
          if (showLoader) {
            setLoading(true);
          } else {
            setRefreshing(true);
          }

          setError("");

          const token =
            localStorage.getItem(
              "access_token"
            );

          if (!token) {
            window.location.href =
              "/";

            return;
          }

          const headers = {
            Authorization:
              `Bearer ${token}`,
          };

          /* =============================================
             BACKEND BOOKINGS
          ============================================= */

          let backendBookings:
            ReportBooking[] = [];

          try {
            const response =
              await axios.get<BookingResponse>(
                `${API_BASE_URL}/bookings`,
                {
                  params: {
                    page: 1,
                    page_size: 100,
                  },
                  headers,
                }
              );

            backendBookings =
              convertBackendBookings(
                response.data.items ||
                  []
              );
          } catch (bookingError) {
            console.error(
              "Unable to load backend bookings:",
              bookingError
            );
          }

          /* =============================================
             LOCAL BOOKINGS
          ============================================= */

          const localBookings =
            getLocalBookings();

          /* =============================================
             FRONTEND CANCELLED HISTORY
          ============================================= */

          const cancelledBookings =
            getFrontendCancelledBookings();

          /* =============================================
             MERGE ALL BOOKINGS
          ============================================= */

          const allBookings =
            mergeBookings(
              backendBookings,
              localBookings,
              cancelledBookings
            );

          /* =============================================
             CALCULATE MONTHLY SUMMARY
          ============================================= */

          const calculatedReport =
            calculateMonthlySummary(
              allBookings
            );

          setMonthlyReport(
            calculatedReport
          );

          /* =============================================
             LOAD ROOM / RESOURCE / UPCOMING
          ============================================= */

          const [
            utilizationResult,
            resourceResult,
            upcomingResult,
          ] = await Promise.allSettled([
            axios.get(
              `${API_BASE_URL}/dashboard/room-utilization`,
              {
                params: {
                  year,
                  month,
                },
                headers,
              }
            ),

            axios.get(
              `${API_BASE_URL}/dashboard/resource-usage`,
              {
                params: {
                  year,
                  month,
                },
                headers,
              }
            ),

            axios.get<
              UpcomingMeeting[]
            >(
              `${API_BASE_URL}/dashboard/upcoming-meetings`,
              {
                headers,
              }
            ),
          ]);

          /* =============================================
             ROOM UTILIZATION
          ============================================= */

          if (
            utilizationResult.status ===
              "fulfilled" &&
            Array.isArray(
              utilizationResult.value
                .data
            )
          ) {
            setRoomUtilization(
              utilizationResult.value
                .data
            );
          } else {
            setRoomUtilization(
              []
            );
          }

          /* =============================================
             RESOURCE USAGE
          ============================================= */

          if (
            resourceResult.status ===
              "fulfilled" &&
            Array.isArray(
              resourceResult.value
                .data
            )
          ) {
            setResourceUsage(
              resourceResult.value
                .data
            );
          } else {
            setResourceUsage(
              []
            );
          }

          /* =============================================
             UPCOMING MEETINGS
          ============================================= */

          let backendUpcoming:
            UpcomingMeeting[] =
            [];

          if (
            upcomingResult.status ===
              "fulfilled" &&
            Array.isArray(
              upcomingResult.value
                .data
            )
          ) {
            backendUpcoming =
              upcomingResult.value
                .data;
          }

          const combinedUpcoming =
            createUpcomingMeetings(
              backendUpcoming,
              allBookings
            );

          setUpcomingMeetings(
            combinedUpcoming
          );
        } catch (err: unknown) {
          if (
            axios.isAxiosError(
              err
            )
          ) {
            if (
              err.response
                ?.status ===
              401
            ) {
              localStorage.removeItem(
                "access_token"
              );

              window.location.href =
                "/";

              return;
            }

            setError(
              err.response?.data
                ?.detail ||
                "Unable to load reports."
            );
          } else {
            setError(
              "Unable to load reports."
            );
          }
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [year, month]
    );

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    fetchReports(true);
  }, [fetchReports]);

  /* =========================================================
     AUTO REFRESH EVERY 10 SECONDS
  ========================================================= */

  useEffect(() => {
    const interval =
      setInterval(() => {
        fetchReports(false);
      }, 10000);

    return () => {
      clearInterval(
        interval
      );
    };
  }, [fetchReports]);

  /* =========================================================
     REFRESH WHEN WINDOW GETS FOCUS
  ========================================================= */

  useEffect(() => {
    const handleFocus =
      () => {
        fetchReports(false);
      };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [fetchReports]);

  /* =========================================================
     FORMAT DATE/TIME
  ========================================================= */

  const formatDateTime = (
    value: string
  ) => {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  /* =========================================================
     MANUAL REFRESH
  ========================================================= */

  const handleRefresh = () => {
    fetchReports(false);
  };

  /* =========================================================
     EXPORT REPORT
  ========================================================= */

  const downloadReport =
    async (
      type:
        | "excel"
        | "pdf"
    ) => {
      try {
        setExporting(type);
        setError("");

        const token =
          localStorage.getItem(
            "access_token"
          );

        if (!token) {
          window.location.href =
            "/";

          return;
        }

        const endpoint =
          type === "excel"
            ? `${API_BASE_URL}/dashboard/export/excel`
            : `${API_BASE_URL}/dashboard/export/pdf`;

        const response =
          await axios.get(
            endpoint,
            {
              params: {
                year,
                month,
              },
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              responseType:
                "blob",
            }
          );

        const disposition =
          response.headers[
            "content-disposition"
          ];

        let filename =
          type === "excel"
            ? `meeting_room_report_${year}_${month
                .toString()
                .padStart(
                  2,
                  "0"
                )}.xlsx`
            : `meeting_room_report_${year}_${month
                .toString()
                .padStart(
                  2,
                  "0"
                )}.pdf`;

        if (disposition) {
          const match =
            disposition.match(
              /filename="?([^"]+)"?/i
            );

          if (match?.[1]) {
            filename =
              match[1];
          }
        }

        const blob =
          new Blob(
            [response.data],
            {
              type:
                type === "excel"
                  ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  : "application/pdf",
            }
          );

        const url =
          window.URL.createObjectURL(
            blob
          );

        const link =
          document.createElement(
            "a"
          );

        link.href = url;
        link.download =
          filename;

        document.body.appendChild(
          link
        );

        link.click();

        document.body.removeChild(
          link
        );

        window.URL.revokeObjectURL(
          url
        );
      } catch (err: unknown) {
        if (
          axios.isAxiosError(
            err
          )
        ) {
          if (
            err.response
              ?.status ===
            401
          ) {
            localStorage.removeItem(
              "access_token"
            );

            window.location.href =
              "/";

            return;
          }

          setError(
            err.response?.data
              ?.detail ||
              `Unable to export ${type.toUpperCase()} report.`
          );
        } else {
          setError(
            `Unable to export ${type.toUpperCase()} report.`
          );
        }
      } finally {
        setExporting(null);
      }
    };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <Box
      sx={{
        width: "100%",
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <Box
        sx={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap: 2,
          flexWrap:
            "wrap",
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            gutterBottom
          >
            Reports
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
          >
            View room utilization,
            resource usage, monthly
            booking statistics, and
            upcoming meetings.
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1,
            }}
          >
            Report period:{" "}
            <strong>
              {month
                .toString()
                .padStart(
                  2,
                  "0"
                )}
              /{year}
            </strong>
          </Typography>
        </Box>

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1.5}
        >
          <Button
            variant="outlined"
            startIcon={
              <RefreshIcon />
            }
            onClick={
              handleRefresh
            }
            disabled={
              refreshing ||
              loading
            }
            sx={{
              textTransform:
                "none",
            }}
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </Button>

          <Button
            variant="outlined"
            startIcon={
              <TableChartIcon />
            }
            onClick={() =>
              downloadReport(
                "excel"
              )
            }
            disabled={
              exporting !==
                null ||
              loading
            }
            sx={{
              textTransform:
                "none",
            }}
          >
            {exporting ===
            "excel"
              ? "Exporting..."
              : "Export Excel"}
          </Button>

          <Button
            variant="contained"
            startIcon={
              <PictureAsPdfIcon />
            }
            onClick={() =>
              downloadReport(
                "pdf"
              )
            }
            disabled={
              exporting !==
                null ||
              loading
            }
            sx={{
              textTransform:
                "none",
            }}
          >
            {exporting ===
            "pdf"
              ? "Exporting..."
              : "Export PDF"}
          </Button>
        </Stack>
      </Box>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
        >
          {error}
        </Alert>
      )}

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <Box
          sx={{
            minHeight: 300,
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={4}>
          {/* =================================================
              MONTHLY BOOKING SUMMARY
          ================================================= */}

          <Box>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                mb: 2,
              }}
            >
              Monthly Booking Summary
            </Typography>

            <Grid
              container
              spacing={3}
            >
              {/* TOTAL BOOKINGS */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  lg: 3,
                }}
              >
                <Card
                  elevation={2}
                  sx={{
                    borderRadius: 3,
                    height:
                      "100%",
                  }}
                >
                  <CardContent>
                    <Typography
                      color="text.secondary"
                    >
                      Total Bookings
                    </Typography>

                    <Typography
                      variant="h3"
                      fontWeight={700}
                      color="primary"
                      sx={{
                        mt: 1,
                      }}
                    >
                      {monthlyReport
                        ?.total_bookings ??
                        0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* CONFIRMED */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  lg: 3,
                }}
              >
                <Card
                  elevation={2}
                  sx={{
                    borderRadius: 3,
                    height:
                      "100%",
                  }}
                >
                  <CardContent>
                    <Typography
                      color="text.secondary"
                    >
                      Confirmed
                    </Typography>

                    <Typography
                      variant="h3"
                      fontWeight={700}
                      color="success.main"
                      sx={{
                        mt: 1,
                      }}
                    >
                      {monthlyReport
                        ?.confirmed_bookings ??
                        0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* CANCELLED */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  lg: 3,
                }}
              >
                <Card
                  elevation={2}
                  sx={{
                    borderRadius: 3,
                    height:
                      "100%",
                  }}
                >
                  <CardContent>
                    <Typography
                      color="text.secondary"
                    >
                      Cancelled
                    </Typography>

                    <Typography
                      variant="h3"
                      fontWeight={700}
                      color="error.main"
                      sx={{
                        mt: 1,
                      }}
                    >
                      {monthlyReport
                        ?.cancelled_bookings ??
                        0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* BOOKED HOURS */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  lg: 3,
                }}
              >
                <Card
                  elevation={2}
                  sx={{
                    borderRadius: 3,
                    height:
                      "100%",
                  }}
                >
                  <CardContent>
                    <Typography
                      color="text.secondary"
                    >
                      Booked Hours
                    </Typography>

                    <Typography
                      variant="h3"
                      fontWeight={700}
                      color="info.main"
                      sx={{
                        mt: 1,
                      }}
                    >
                      {Number(
                        monthlyReport
                          ?.total_booked_hours ??
                          0
                      ).toFixed(
                        2
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* =================================================
              ROOM UTILIZATION
          ================================================= */}

          <Card
            elevation={2}
            sx={{
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                fontWeight={700}
              >
                Room Utilization
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 2,
                }}
              >
                Meeting room usage for
                the selected month.
              </Typography>

              <Divider
                sx={{
                  mb: 2,
                }}
              />

              {roomUtilization.length ===
              0 ? (
                <Typography color="text.secondary">
                  No room utilization
                  data available.
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>
                            Room
                          </strong>
                        </TableCell>

                        <TableCell align="right">
                          <strong>
                            Bookings
                          </strong>
                        </TableCell>

                        <TableCell align="right">
                          <strong>
                            Booked Hours
                          </strong>
                        </TableCell>

                        <TableCell align="right">
                          <strong>
                            Utilization
                          </strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {roomUtilization.map(
                        (room) => (
                          <TableRow
                            key={
                              room.room_id
                            }
                          >
                            <TableCell>
                              {
                                room.room_name
                              }
                            </TableCell>

                            <TableCell align="right">
                              {
                                room.booking_count
                              }
                            </TableCell>

                            <TableCell align="right">
                              {Number(
                                room.total_booked_hours
                              ).toFixed(
                                2
                              )}
                            </TableCell>

                            <TableCell align="right">
                              {Number(
                                room.utilization_percentage
                              ).toFixed(
                                2
                              )}
                              %
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* =================================================
              RESOURCE USAGE
          ================================================= */}

          <Card
            elevation={2}
            sx={{
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                fontWeight={700}
              >
                Resource Usage
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 2,
                }}
              >
                Resource reservation
                statistics for the
                selected month.
              </Typography>

              <Divider
                sx={{
                  mb: 2,
                }}
              />

              {resourceUsage.length ===
              0 ? (
                <Typography color="text.secondary">
                  No resource usage
                  data available.
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>
                            Resource
                          </strong>
                        </TableCell>

                        <TableCell align="right">
                          <strong>
                            Quantity
                            Booked
                          </strong>
                        </TableCell>

                        <TableCell align="right">
                          <strong>
                            Booking
                            Count
                          </strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {resourceUsage.map(
                        (
                          resource
                        ) => (
                          <TableRow
                            key={
                              resource.resource_id
                            }
                          >
                            <TableCell>
                              {
                                resource.resource_name
                              }
                            </TableCell>

                            <TableCell align="right">
                              {
                                resource.total_quantity_booked
                              }
                            </TableCell>

                            <TableCell align="right">
                              {
                                resource.booking_count
                              }
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* =================================================
              UPCOMING MEETINGS
          ================================================= */}

          <Card
            elevation={2}
            sx={{
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                fontWeight={700}
              >
                Upcoming Meetings
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 2,
                }}
              >
                Your upcoming
                scheduled meetings.
              </Typography>

              <Divider
                sx={{
                  mb: 2,
                }}
              />

              {upcomingMeetings.length ===
              0 ? (
                <Typography color="text.secondary">
                  No upcoming
                  meetings found.
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>
                            Meeting
                          </strong>
                        </TableCell>

                        <TableCell>
                          <strong>
                            Room
                          </strong>
                        </TableCell>

                        <TableCell>
                          <strong>
                            Start
                          </strong>
                        </TableCell>

                        <TableCell>
                          <strong>
                            End
                          </strong>
                        </TableCell>

                        <TableCell>
                          <strong>
                            Status
                          </strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {upcomingMeetings.map(
                        (meeting) => (
                          <TableRow
                            key={
                              String(
                                meeting.booking_id
                              )
                            }
                          >
                            <TableCell>
                              {
                                meeting.title
                              }
                            </TableCell>

                            <TableCell>
                              Room{" "}
                              {
                                meeting.room_id
                              }
                            </TableCell>

                            <TableCell>
                              {formatDateTime(
                                meeting.start_datetime
                              )}
                            </TableCell>

                            <TableCell>
                              {formatDateTime(
                                meeting.end_datetime
                              )}
                            </TableCell>

                            <TableCell>
                              <Typography
                                component="span"
                                sx={{
                                  fontWeight: 700,

                                  color:
                                    meeting.status.toUpperCase() ===
                                    "CANCELLED"
                                      ? "error.main"
                                      : meeting.status.toUpperCase() ===
                                        "CONFIRMED"
                                      ? "success.main"
                                      : "text.primary",
                                }}
                              >
                                {
                                  meeting.status
                                }
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
}

export default Reports;
