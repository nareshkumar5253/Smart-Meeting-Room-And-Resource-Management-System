
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";

const API_BASE_URL = "http://127.0.0.1:8000";

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
  parent_booking_id: number | null;
  created_at?: string;
  updated_at?: string;
}

/* =========================================================
   FRONTEND BOOKING
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
   DISPLAY BOOKING
========================================================= */

interface DisplayBooking {
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
  source: "backend" | "local";
}

/* =========================================================
   PAGINATION
========================================================= */

interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

interface BookingResponse {
  items: BackendBooking[];
  pagination: Pagination;
}

/* =========================================================
   SAVE FRONTEND CANCELLATION
========================================================= */

const saveFrontendCancellation = (
  booking: DisplayBooking
) => {
  try {
    const storageKey =
      "frontend_cancelled_bookings";

    const stored =
      localStorage.getItem(storageKey);

    const existing = stored
      ? JSON.parse(stored)
      : [];

    const cancellation = {
      id: String(booking.id),
      room_id: booking.room_id,
      title: booking.title,
      description: booking.description,
      start_datetime:
        booking.start_datetime,
      end_datetime:
        booking.end_datetime,
      status: "CANCELLED",
      is_recurring:
        booking.is_recurring,
      recurrence_rule:
        booking.recurrence_rule,
      recurrence_end_date:
        booking.recurrence_end_date,
      cancelled_at:
        new Date().toISOString(),
    };

    const alreadyExists =
      existing.some(
        (item: { id: string }) =>
          String(item.id) ===
          String(booking.id)
      );

    if (!alreadyExists) {
      localStorage.setItem(
        storageKey,
        JSON.stringify([
          cancellation,
          ...existing,
        ])
      );
    }
  } catch (error) {
    console.error(
      "Unable to save frontend cancellation:",
      error
    );
  }
};

/* =========================================================
   COMPONENT
========================================================= */

function Bookings() {
  const [bookings, setBookings] =
    useState<DisplayBooking[]>([]);

  const [pagination, setPagination] =
    useState<Pagination | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [page, setPage] =
    useState(1);

  const pageSize = 10;

  /* =======================================================
     SUCCESS NOTIFICATION
  ======================================================= */

  const [successMessage, setSuccessMessage] =
    useState("");

  /* =======================================================
     CANCEL DIALOG
  ======================================================= */

  const [cancelDialogOpen, setCancelDialogOpen] =
    useState(false);

  const [selectedBooking, setSelectedBooking] =
    useState<DisplayBooking | null>(null);

  const [cancelling, setCancelling] =
    useState(false);

  /* =======================================================
     CONVERT LOCAL BOOKING
  ======================================================= */

  const convertLocalBooking = (
    booking: LocalBooking
  ): DisplayBooking => {
    return {
      id: booking.id,

      room_id: booking.room_id,

      title: booking.room_name,

      description:
        booking.notes || null,

      start_datetime:
        `${booking.booking_date}T${booking.start_time}:00`,

      end_datetime:
        `${booking.booking_date}T${booking.end_time}:00`,

      status: "CONFIRMED",

      is_recurring: false,

      recurrence_rule: null,

      recurrence_end_date: null,

      source: "local",
    };
  };

  /* =======================================================
     LOAD LOCAL BOOKINGS
  ======================================================= */

  const getLocalBookings =
    (): DisplayBooking[] => {
      try {
        const stored =
          localStorage.getItem(
            "meeting_room_bookings"
          );

        if (!stored) {
          return [];
        }

        const parsed: LocalBooking[] =
          JSON.parse(stored);

        if (!Array.isArray(parsed)) {
          return [];
        }

        return parsed.map(
          convertLocalBooking
        );
      } catch (error) {
        console.error(
          "Unable to read local bookings:",
          error
        );

        return [];
      }
    };

  /* =======================================================
     FETCH BOOKINGS
  ======================================================= */

  const fetchBookings = async (
    currentPage: number
  ) => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        window.location.href = "/";
        return;
      }

      let backendBookings:
        DisplayBooking[] = [];

      let backendPagination:
        Pagination | null = null;

      /* ===================================================
         GET BACKEND BOOKINGS
      =================================================== */

      try {
        const response =
          await axios.get<BookingResponse>(
            `${API_BASE_URL}/bookings`,
            {
              params: {
                page: currentPage,
                page_size: pageSize,
              },

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        backendBookings =
          (
            response.data.items || []
          ).map((booking) => ({
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
              booking.status,

            is_recurring:
              booking.is_recurring,

            recurrence_rule:
              booking.recurrence_rule,

            recurrence_end_date:
              booking.recurrence_end_date,

            source:
              "backend" as const,
          }));

        backendPagination =
          response.data.pagination ||
          null;
      } catch (backendError) {
        console.warn(
          "Backend bookings unavailable:",
          backendError
        );
      }

      /* ===================================================
         GET LOCAL BOOKINGS
      =================================================== */

      const localBookings =
        getLocalBookings();

      /* ===================================================
         COMBINE
      =================================================== */

      const combinedBookings = [
        ...backendBookings,
        ...localBookings,
      ];

      /* ===================================================
         REMOVE DUPLICATES
      =================================================== */

      const uniqueBookings =
        combinedBookings.filter(
          (booking, index, array) =>
            index ===
            array.findIndex(
              (item) =>
                String(item.id) ===
                String(booking.id)
            )
        );

      /* ===================================================
         SORT
      =================================================== */

      uniqueBookings.sort((a, b) => {
        return (
          new Date(
            b.start_datetime
          ).getTime() -
          new Date(
            a.start_datetime
          ).getTime()
        );
      });

      setBookings(uniqueBookings);

      /* ===================================================
         PAGINATION
      =================================================== */

      if (backendPagination) {
        setPagination(
          backendPagination
        );
      } else {
        setPagination(null);
      }
    } catch (err: unknown) {
      console.error(
        "Booking loading error:",
        err
      );

      setError(
        "Unable to load bookings."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     LOAD ON PAGE OPEN
  ======================================================= */

  useEffect(() => {
    fetchBookings(page);
  }, [page]);

  /* =======================================================
     FORMAT DATE TIME
  ======================================================= */

  const formatDateTime = (
    value: string
  ) => {
    const date = new Date(value);

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

  /* =======================================================
     STATUS COLOR
  ======================================================= */

  const getStatusColor = (
    status: string
  ):
    | "success"
    | "error"
    | "warning"
    | "default" => {
    switch (
      status.toUpperCase()
    ) {
      case "CONFIRMED":
        return "success";

      case "CANCELLED":
        return "error";

      case "PENDING":
        return "warning";

      default:
        return "default";
    }
  };

  /* =======================================================
     OPEN CANCEL DIALOG
  ======================================================= */

  const openCancelDialog = (
    booking: DisplayBooking
  ) => {
    setSelectedBooking(
      booking
    );

    setCancelDialogOpen(true);
  };

  /* =======================================================
     CLOSE CANCEL DIALOG
  ======================================================= */

  const closeCancelDialog = () => {
    if (cancelling) {
      return;
    }

    setCancelDialogOpen(false);

    setSelectedBooking(null);
  };

  /* =======================================================
     CANCEL LOCAL BOOKING
  ======================================================= */

  const cancelLocalBooking = (
    booking: DisplayBooking
  ) => {
    try {
      const stored =
        localStorage.getItem(
          "meeting_room_bookings"
        );

      if (!stored) {
        return;
      }

      const localBookings:
        LocalBooking[] =
        JSON.parse(stored);

      const updated =
        localBookings.filter(
          (item) =>
            String(item.id) !==
            String(booking.id)
        );

      localStorage.setItem(
        "meeting_room_bookings",
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error(
        "Unable to cancel local booking:",
        error
      );
    }
  };

  /* =======================================================
     CANCEL BOOKING
  ======================================================= */

  const handleCancelBooking =
    async () => {
      if (!selectedBooking) {
        return;
      }

      const cancelledBooking =
        selectedBooking;

      try {
        setCancelling(true);
        setError("");

        /* =============================================
           SAVE CANCELLATION HISTORY FIRST
        ============================================= */

        saveFrontendCancellation(
          cancelledBooking
        );

        /* =============================================
           LOCAL BOOKING
        ============================================= */

        if (
          cancelledBooking.source ===
          "local"
        ) {
          cancelLocalBooking(
            cancelledBooking
          );

          setCancelDialogOpen(false);

          setSelectedBooking(null);

          await fetchBookings(page);

          setSuccessMessage(
            `Booking "${cancelledBooking.title}" cancelled successfully.`
          );

          return;
        }

        /* =============================================
           BACKEND BOOKING
        ============================================= */

        const token =
          localStorage.getItem(
            "access_token"
          );

        if (!token) {
          window.location.href = "/";
          return;
        }

        /* =============================================
           CANCEL API
        ============================================= */

        await axios.patch(
          `${API_BASE_URL}/bookings/${cancelledBooking.id}/cancel`,
          {},
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        /* =============================================
           CLOSE DIALOG
        ============================================= */

        setCancelDialogOpen(false);

        setSelectedBooking(null);

        /* =============================================
           REFRESH BOOKINGS
        ============================================= */

        await fetchBookings(page);

        /* =============================================
           SUCCESS
        ============================================= */

        setSuccessMessage(
          `Booking "${cancelledBooking.title}" cancelled successfully.`
        );
      } catch (err: unknown) {
        console.error(
          "Cancel booking error:",
          err
        );

        if (
          axios.isAxiosError(err)
        ) {
          setError(
            err.response?.data?.detail ||
              "Unable to cancel the booking."
          );
        } else {
          setError(
            "Unable to cancel the booking."
          );
        }
      } finally {
        setCancelling(false);
      }
    };

  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = () => {
    fetchBookings(page);
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <Box
      sx={{
        width: "100%",
      }}
    >
      {/* HEADER */}

      <Box
        sx={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          gap: 2,
          flexWrap: "wrap",
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              color: "#202124",
            }}
          >
            My Bookings
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mt: 0.5,
            }}
          >
            View and manage your
            meeting room bookings.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={
            handleRefresh
          }
          disabled={loading}
          sx={{
            textTransform:
              "none",
            borderRadius: 1.5,
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* ERROR */}

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

      {/* LOADING */}

      {loading ? (
        <Box
          sx={{
            minHeight: 300,
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : bookings.length ===
        0 ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border:
              "1px solid #e2e2e2",
          }}
        >
          <CardContent
            sx={{
              py: 7,
              textAlign: "center",
            }}
          >
            <Typography
              variant="h6"
              fontWeight={700}
            >
              No bookings found
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                mt: 1,
              }}
            >
              You have not booked
              any meeting rooms
              yet.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid
            container
            spacing={3}
          >
            {bookings.map(
              (booking) => (
                <Grid
                  key={`${booking.source}-${booking.id}`}
                  size={{
                    xs: 12,
                    md: 6,
                  }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      border:
                        "1px solid #e1e1e1",
                      boxShadow:
                        "0 4px 15px rgba(0,0,0,0.06)",
                    }}
                  >
                    <CardContent
                      sx={{
                        p: 3,
                      }}
                    >
                      <Stack
                        spacing={2}
                      >
                        {/* TITLE */}

                        <Box
                          sx={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "flex-start",
                            gap: 2,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="h6"
                              fontWeight={
                                800
                              }
                            >
                              {
                                booking.title
                              }
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mt: 0.3,
                              }}
                            >
                              Booking #
                              {
                                booking.id
                              }
                            </Typography>
                          </Box>

                          <Chip
                            label={
                              booking.status
                            }
                            color={getStatusColor(
                              booking.status
                            )}
                            size="small"
                          />
                        </Box>

                        {/* DESCRIPTION */}

                        {booking.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {
                              booking.description
                            }
                          </Typography>
                        )}

                        {/* ROOM */}

                        <Typography
                          variant="body2"
                        >
                          <strong>
                            Room ID:
                          </strong>{" "}
                          {
                            booking.room_id
                          }
                        </Typography>

                        {/* START */}

                        <Typography
                          variant="body2"
                        >
                          <strong>
                            Start:
                          </strong>{" "}
                          {formatDateTime(
                            booking.start_datetime
                          )}
                        </Typography>

                        {/* END */}

                        <Typography
                          variant="body2"
                        >
                          <strong>
                            End:
                          </strong>{" "}
                          {formatDateTime(
                            booking.end_datetime
                          )}
                        </Typography>

                        {/* BOOKING TYPE */}

                        <Box>
                          <Chip
                            label={
                              booking.is_recurring
                                ? `Recurring${
                                    booking.recurrence_rule
                                      ? ` - ${booking.recurrence_rule}`
                                      : ""
                                  }`
                                : "One-time"
                            }
                            size="small"
                            variant="outlined"
                          />
                        </Box>

                        {/* RECURRING DATE */}

                        {booking.is_recurring &&
                          booking.recurrence_end_date && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              <strong>
                                Recurs until:
                              </strong>{" "}
                              {new Date(
                                booking.recurrence_end_date
                              ).toLocaleDateString(
                                "en-IN"
                              )}
                            </Typography>
                          )}

                        {/* SOURCE */}

                        <Chip
                          label={
                            booking.source ===
                            "local"
                              ? "Frontend Booking"
                              : "Database Booking"
                          }
                          size="small"
                          sx={{
                            width:
                              "fit-content",

                            backgroundColor:
                              booking.source ===
                              "local"
                                ? "#eef5ff"
                                : "#edf8ef",

                            color:
                              booking.source ===
                              "local"
                                ? "#176bc5"
                                : "#2e8538",
                          }}
                        />

                        {/* CANCEL */}

                        {booking.status.toUpperCase() !==
                          "CANCELLED" && (
                          <Box
                            sx={{
                              pt: 1,
                            }}
                          >
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() =>
                                openCancelDialog(
                                  booking
                                )
                              }
                              sx={{
                                textTransform:
                                  "none",
                                borderRadius:
                                  1.5,
                              }}
                            >
                              Cancel Booking
                            </Button>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )
            )}
          </Grid>

          {/* PAGINATION */}

          {pagination &&
            pagination.total_pages >
              1 && (
              <Box
                sx={{
                  mt: 4,
                  display:
                    "flex",
                  justifyContent:
                    "center",
                  alignItems:
                    "center",
                  gap: 2,
                }}
              >
                <Button
                  variant="outlined"
                  disabled={
                    page <= 1
                  }
                  onClick={() =>
                    setPage(
                      (previous) =>
                        previous - 1
                    )
                  }
                  sx={{
                    textTransform:
                      "none",
                  }}
                >
                  Previous
                </Button>

                <Typography>
                  Page{" "}
                  {
                    pagination.page
                  }{" "}
                  of{" "}
                  {
                    pagination.total_pages
                  }
                </Typography>

                <Button
                  variant="outlined"
                  disabled={
                    page >=
                    pagination.total_pages
                  }
                  onClick={() =>
                    setPage(
                      (previous) =>
                        previous + 1
                    )
                  }
                  sx={{
                    textTransform:
                      "none",
                  }}
                >
                  Next
                </Button>
              </Box>
            )}
        </>
      )}

      {/* CANCEL DIALOG */}

      <Dialog
        open={cancelDialogOpen}
        onClose={
          closeCancelDialog
        }
      >
        <DialogTitle>
          Cancel Booking
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            Are you sure you
            want to cancel{" "}
            <strong>
              {
                selectedBooking?.title
              }
            </strong>
            ?
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={
              closeCancelDialog
            }
            disabled={
              cancelling
            }
            sx={{
              textTransform:
                "none",
            }}
          >
            No
          </Button>

          <Button
            onClick={
              handleCancelBooking
            }
            color="error"
            variant="contained"
            disabled={
              cancelling
            }
            sx={{
              textTransform:
                "none",
            }}
          >
            {cancelling ? (
              <CircularProgress
                size={22}
                color="inherit"
              />
            ) : (
              "Yes, Cancel"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SUCCESS NOTIFICATION */}

      <Snackbar
        open={Boolean(
          successMessage
        )}
        autoHideDuration={5000}
        onClose={() =>
          setSuccessMessage("")
        }
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() =>
            setSuccessMessage("")
          }
          sx={{
            width: "100%",
            fontWeight: 600,
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Bookings;
