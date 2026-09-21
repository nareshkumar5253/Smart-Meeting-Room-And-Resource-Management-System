
import { useCallback, useEffect, useState } from "react";
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
  Stack,
  Typography,
} from "@mui/material";

const API_BASE_URL = "http://127.0.0.1:8000";

const FRONTEND_NOTIFICATIONS_KEY =
  "frontend_notifications";

const BOOKING_SNAPSHOT_KEY =
  "notification_booking_snapshot";

/* =========================================================
   BACKEND NOTIFICATION
========================================================= */

interface BackendNotification {
  id: number;
  user_id: number;
  booking_id: number | null;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
}

/* =========================================================
   FRONTEND NOTIFICATION
========================================================= */

interface FrontendNotification {
  id: string;
  user_id: number;
  booking_id: number | string | null;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
  source: "frontend";
}

/* =========================================================
   DISPLAY NOTIFICATION
========================================================= */

type DisplayNotification =
  | (BackendNotification & {
      source: "backend";
    })
  | FrontendNotification;

/* =========================================================
   BOOKING DATA
========================================================= */

interface Booking {
  id: number | string;
  room_id?: number;
  title?: string;
  description?: string | null;
  start_datetime?: string;
  end_datetime?: string;
  status?: string;
  created_at?: string;
}

/* =========================================================
   API RESPONSE
========================================================= */

interface BookingResponse {
  items?: Booking[];
}

/* =========================================================
   COMPONENT
========================================================= */

function Notifications() {
  const [notifications, setNotifications] =
    useState<DisplayNotification[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [markingRead, setMarkingRead] =
    useState<string | number | null>(null);

  /* =======================================================
     GET FRONTEND NOTIFICATIONS
  ======================================================= */

  const getFrontendNotifications =
    (): FrontendNotification[] => {
      try {
        const stored = localStorage.getItem(
          FRONTEND_NOTIFICATIONS_KEY
        );

        if (!stored) {
          return [];
        }

        const parsed = JSON.parse(stored);

        if (!Array.isArray(parsed)) {
          return [];
        }

        return parsed;
      } catch (error) {
        console.error(
          "Unable to read frontend notifications:",
          error
        );

        return [];
      }
    };

  /* =======================================================
     SAVE FRONTEND NOTIFICATIONS
  ======================================================= */

  const saveFrontendNotifications = (
    items: FrontendNotification[]
  ) => {
    localStorage.setItem(
      FRONTEND_NOTIFICATIONS_KEY,
      JSON.stringify(items)
    );
  };

  /* =======================================================
     ADD FRONTEND NOTIFICATION
  ======================================================= */

  const addFrontendNotification = (
    notification: FrontendNotification
  ) => {
    const existing =
      getFrontendNotifications();

    const alreadyExists =
      existing.some(
        (item) => item.id === notification.id
      );

    if (alreadyExists) {
      return;
    }

    const updated = [
      notification,
      ...existing,
    ];

    saveFrontendNotifications(updated);
  };

  /* =======================================================
     GET BOOKING SNAPSHOT
  ======================================================= */

  const getBookingSnapshot = (): Record<
    string,
    {
      status: string;
      title: string;
    }
  > => {
    try {
      const stored = localStorage.getItem(
        BOOKING_SNAPSHOT_KEY
      );

      if (!stored) {
        return {};
      }

      const parsed = JSON.parse(stored);

      if (
        !parsed ||
        typeof parsed !== "object"
      ) {
        return {};
      }

      return parsed;
    } catch {
      return {};
    }
  };

  /* =======================================================
     SAVE BOOKING SNAPSHOT
  ======================================================= */

  const saveBookingSnapshot = (
    snapshot: Record<
      string,
      {
        status: string;
        title: string;
      }
    >
  ) => {
    localStorage.setItem(
      BOOKING_SNAPSHOT_KEY,
      JSON.stringify(snapshot)
    );
  };

  /* =======================================================
     CHECK BOOKING CHANGES
  ======================================================= */

  const checkBookingChanges =
    useCallback(async () => {
      try {
        const token =
          localStorage.getItem(
            "access_token"
          );

        if (!token) {
          return;
        }

        let backendBookings: Booking[] =
          [];

        /* ---------------------------------------------
           BACKEND BOOKINGS
        --------------------------------------------- */

        try {
          const response =
            await axios.get<BookingResponse>(
              `${API_BASE_URL}/bookings`,
              {
                params: {
                  page: 1,
                  page_size: 100,
                },
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          backendBookings =
            response.data.items || [];
        } catch {
          backendBookings = [];
        }

        /* ---------------------------------------------
           LOCAL BOOKINGS
        --------------------------------------------- */

        let localBookings: Booking[] =
          [];

        try {
          const stored =
            localStorage.getItem(
              "meeting_room_bookings"
            );

          if (stored) {
            const parsed =
              JSON.parse(stored);

            if (Array.isArray(parsed)) {
              localBookings = parsed;
            }
          }
        } catch {
          localBookings = [];
        }

        /* ---------------------------------------------
           COMBINE
        --------------------------------------------- */

        const allBookings = [
          ...backendBookings,
          ...localBookings,
        ];

        const currentSnapshot: Record<
          string,
          {
            status: string;
            title: string;
          }
        > = {};

        allBookings.forEach((booking) => {
          const id = String(booking.id);

          currentSnapshot[id] = {
            status:
              (
                booking.status ||
                "CONFIRMED"
              ).toUpperCase(),

            title:
              booking.title ||
              "Meeting Room Booking",
          };
        });

        /* ---------------------------------------------
           PREVIOUS SNAPSHOT
        --------------------------------------------- */

        const previousSnapshot =
          getBookingSnapshot();

        const hasPreviousSnapshot =
          Object.keys(
            previousSnapshot
          ).length > 0;

        /* ---------------------------------------------
           FIRST RUN
           
           We create the initial snapshot only.
           Existing old bookings will NOT create
           fake notifications.
        --------------------------------------------- */

        if (!hasPreviousSnapshot) {
          saveBookingSnapshot(
            currentSnapshot
          );
          return;
        }

        /* ---------------------------------------------
           NEW BOOKINGS
        --------------------------------------------- */

        Object.entries(
          currentSnapshot
        ).forEach(([id, booking]) => {
          const previous =
            previousSnapshot[id];

          if (!previous) {
            addFrontendNotification({
              id: `booking-new-${id}`,
              user_id: 0,
              booking_id: id,
              notification_type:
                "BOOKING_CONFIRMATION",
              title:
                "Booking Confirmed",
              message:
                `Your booking "${booking.title}" has been created successfully.`,
              is_read: false,
              scheduled_for: null,
              sent_at: null,
              created_at:
                new Date().toISOString(),
              source: "frontend",
            });
          }
        });

        /* ---------------------------------------------
           BOOKING CANCELLATIONS
        --------------------------------------------- */

        Object.entries(
          previousSnapshot
        ).forEach(([id, previous]) => {
          const current =
            currentSnapshot[id];

          /* -----------------------------------------
             BACKEND STATUS CHANGED TO CANCELLED
          ----------------------------------------- */

          if (
            current &&
            previous.status !==
              "CANCELLED" &&
            current.status === "CANCELLED"
          ) {
            addFrontendNotification({
              id: `booking-cancelled-${id}`,
              user_id: 0,
              booking_id: id,
              notification_type:
                "BOOKING_CANCELLATION",
              title:
                "Booking Cancelled",
              message:
                `Your booking "${current.title}" has been cancelled.`,
              is_read: false,
              scheduled_for: null,
              sent_at: null,
              created_at:
                new Date().toISOString(),
              source: "frontend",
            });
          }

          /* -----------------------------------------
             LOCAL BOOKING WAS REMOVED
          ----------------------------------------- */

          if (!current) {
            addFrontendNotification({
              id: `booking-removed-${id}`,
              user_id: 0,
              booking_id: id,
              notification_type:
                "BOOKING_CANCELLATION",
              title:
                "Booking Cancelled",
              message:
                `Your booking "${previous.title}" has been cancelled.`,
              is_read: false,
              scheduled_for: null,
              sent_at: null,
              created_at:
                new Date().toISOString(),
              source: "frontend",
            });
          }
        });

        /* ---------------------------------------------
           SAVE NEW SNAPSHOT
        --------------------------------------------- */

        saveBookingSnapshot(
          currentSnapshot
        );
      } catch (error) {
        console.error(
          "Booking notification check error:",
          error
        );
      }
    }, []);

  /* =======================================================
     FETCH NOTIFICATIONS
  ======================================================= */

  const fetchNotifications = useCallback(
    async (showLoader = true) => {
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
          window.location.href = "/";
          return;
        }

        /* ---------------------------------------------
           CHECK NEW / CANCELLED BOOKINGS FIRST
        --------------------------------------------- */

        await checkBookingChanges();

        /* ---------------------------------------------
           BACKEND NOTIFICATIONS
        --------------------------------------------- */

        let backendNotifications:
          DisplayNotification[] = [];

        try {
          const response =
            await axios.get<
              BackendNotification[]
            >(
              `${API_BASE_URL}/notifications`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          backendNotifications =
            (
              response.data || []
            ).map(
              (notification) => ({
                ...notification,
                source:
                  "backend" as const,
              })
            );
        } catch (backendError) {
          console.error(
            "Backend notification error:",
            backendError
          );
        }

        /* ---------------------------------------------
           FRONTEND NOTIFICATIONS
        --------------------------------------------- */

        const frontendNotifications =
          getFrontendNotifications();

        /* ---------------------------------------------
           COMBINE
        --------------------------------------------- */

        const combined = [
          ...backendNotifications,
          ...frontendNotifications,
        ];

        /* ---------------------------------------------
           REMOVE DUPLICATES
        --------------------------------------------- */

        const unique =
          combined.filter(
            (notification, index, array) =>
              index ===
              array.findIndex(
                (item) =>
                  String(item.id) ===
                    String(
                      notification.id
                    ) &&
                  item.source ===
                    notification.source
              )
          );

        /* ---------------------------------------------
           SORT NEWEST FIRST
        --------------------------------------------- */

        unique.sort((a, b) => {
          return (
            new Date(
              b.created_at
            ).getTime() -
            new Date(
              a.created_at
            ).getTime()
          );
        });

        setNotifications(unique);
      } catch (err: unknown) {
        console.error(
          "Notification loading error:",
          err
        );

        if (axios.isAxiosError(err)) {
          if (
            err.response?.status === 401
          ) {
            localStorage.removeItem(
              "access_token"
            );

            window.location.href = "/";

            return;
          }

          setError(
            err.response?.data?.detail ||
              "Unable to load notifications."
          );
        } else {
          setError(
            "Unable to load notifications."
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [checkBookingChanges]
  );

  /* =======================================================
     INITIAL LOAD + AUTO REFRESH
  ======================================================= */

  useEffect(() => {
    fetchNotifications(true);

    const interval =
      setInterval(() => {
        fetchNotifications(false);
      }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  /* =======================================================
     MARK AS READ
  ======================================================= */

  const markAsRead = async (
    notification: DisplayNotification
  ) => {
    try {
      setMarkingRead(
        notification.id
      );

      /* ---------------------------------------------
         FRONTEND NOTIFICATION
      --------------------------------------------- */

      if (
        notification.source ===
        "frontend"
      ) {
        const updated =
          getFrontendNotifications().map(
            (item) =>
              item.id ===
              notification.id
                ? {
                    ...item,
                    is_read: true,
                  }
                : item
          );

        saveFrontendNotifications(
          updated
        );

        setNotifications(
          (previous) =>
            previous.map(
              (item) =>
                item.id ===
                  notification.id &&
                item.source ===
                  "frontend"
                  ? {
                      ...item,
                      is_read: true,
                    }
                  : item
            )
        );

        return;
      }

      /* ---------------------------------------------
         BACKEND NOTIFICATION
      --------------------------------------------- */

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        window.location.href = "/";
        return;
      }

      await axios.patch(
        `${API_BASE_URL}/notifications/${notification.id}/read`,
        {
          is_read: true,
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setNotifications(
        (previous) =>
          previous.map(
            (item) =>
              item.id ===
                notification.id &&
              item.source ===
                "backend"
                ? {
                    ...item,
                    is_read: true,
                  }
                : item
          )
      );
    } catch (err: unknown) {
      console.error(
        "Mark notification error:",
        err
      );

      if (axios.isAxiosError(err)) {
        if (
          err.response?.status === 401
        ) {
          localStorage.removeItem(
            "access_token"
          );

          window.location.href = "/";

          return;
        }

        setError(
          err.response?.data?.detail ||
            "Unable to mark notification as read."
        );
      } else {
        setError(
          "Unable to mark notification as read."
        );
      }
    } finally {
      setMarkingRead(null);
    }
  };

  /* =======================================================
     DATE FORMAT
  ======================================================= */

  const formatDateTime = (
    value: string | null
  ) => {
    if (!value) {
      return "Not specified";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
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
     NOTIFICATION COLOR
  ======================================================= */

  const getNotificationColor = (
    type: string
  ):
    | "success"
    | "warning"
    | "error"
    | "info"
    | "default" => {
    switch (
      type.toUpperCase()
    ) {
      case "BOOKING_CONFIRMATION":
        return "success";

      case "MEETING_REMINDER":
        return "warning";

      case "BOOKING_CANCELLATION":
        return "error";

      default:
        return "info";
    }
  };

  /* =======================================================
     CHECK CANCELLATION
  ======================================================= */

  const isCancellation = (
    type: string
  ) =>
    type.toUpperCase() ===
    "BOOKING_CANCELLATION";

  /* =======================================================
     UI
  ======================================================= */

  return (
    <Box sx={{ width: "100%" }}>
      {/* HEADER */}

      <Box
        sx={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "flex-start",
          gap: 2,
          mb: 4,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            gutterBottom
          >
            Notifications
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
          >
            View booking confirmations,
            meeting reminders, and
            cancellation notifications.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={() =>
            fetchNotifications(false)
          }
          disabled={refreshing}
          sx={{
            textTransform: "none",
            borderRadius: 2,
          }}
        >
          {refreshing ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <CircularProgress size={18} />
              Refreshing...
            </Box>
          ) : (
            "Refresh"
          )}
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
            minHeight: 250,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : notifications.length ===
        0 ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border:
              "1px solid #e0e0e0",
          }}
        >
          <CardContent
            sx={{
              py: 6,
              textAlign: "center",
            }}
          >
            <Typography
              variant="h6"
              fontWeight={600}
            >
              No notifications found.
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              Your booking notifications
              will appear here.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {notifications.map(
            (notification) => {
              const cancellation =
                isCancellation(
                  notification.notification_type
                );

              return (
                <Card
                  key={`${notification.source}-${notification.id}`}
                  elevation={
                    cancellation ? 4 : 2
                  }
                  sx={{
                    borderRadius: 3,

                    borderLeft:
                      cancellation
                        ? "6px solid #d32f2f"
                        : notification.is_read
                        ? "4px solid transparent"
                        : "4px solid #1976d2",

                    backgroundColor:
                      cancellation
                        ? "#fff5f5"
                        : "#ffffff",

                    transition: "0.2s",

                    "&:hover": {
                      transform:
                        "translateY(-2px)",
                      boxShadow: 5,
                    },
                  }}
                >
                  <CardContent>
                    <Stack spacing={1.5}>
                      {/* CANCELLATION */}

                      {cancellation && (
                        <Alert
                          severity="error"
                          variant="outlined"
                          sx={{
                            borderRadius: 2,
                            fontWeight: 600,
                          }}
                        >
                          Booking Cancelled
                        </Alert>
                      )}

                      {/* TITLE + STATUS */}

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "flex-start",
                          gap: 2,
                          flexWrap: "wrap",
                        }}
                      >
                        <Box>
                          <Typography
                            variant="h6"
                            fontWeight={700}
                          >
                            {
                              notification.title
                            }
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Notification #
                            {notification.id}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems:
                              "center",
                            gap: 1,
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <Chip
                            label={
                              notification.notification_type
                            }
                            color={getNotificationColor(
                              notification.notification_type
                            )}
                            size="small"
                          />

                          <Chip
                            label={
                              notification.is_read
                                ? "Read"
                                : "Unread"
                            }
                            color={
                              notification.is_read
                                ? "default"
                                : "primary"
                            }
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>

                      <Divider />

                      {/* MESSAGE */}

                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight:
                            cancellation
                              ? 600
                              : 400,
                        }}
                      >
                        {
                          notification.message
                        }
                      </Typography>

                      {/* BOOKING ID */}

                      {notification.booking_id !==
                        null && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          <Box
                            component="span"
                            sx={{
                              fontWeight: 700,
                            }}
                          >
                            Booking ID:
                          </Box>{" "}
                          {
                            notification.booking_id
                          }
                        </Typography>
                      )}

                      {/* CREATED */}

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 700,
                          }}
                        >
                          Created:
                        </Box>{" "}
                        {formatDateTime(
                          notification.created_at
                        )}
                      </Typography>

                      {/* SCHEDULED */}

                      {notification.scheduled_for && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          <Box
                            component="span"
                            sx={{
                              fontWeight: 700,
                            }}
                          >
                            Scheduled For:
                          </Box>{" "}
                          {formatDateTime(
                            notification.scheduled_for
                          )}
                        </Typography>
                      )}

                      {/* SENT */}

                      {notification.sent_at && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          <Box
                            component="span"
                            sx={{
                              fontWeight: 700,
                            }}
                          >
                            Sent:
                          </Box>{" "}
                          {formatDateTime(
                            notification.sent_at
                          )}
                        </Typography>
                      )}

                      {/* MARK AS READ */}

                      {!notification.is_read && (
                        <Box sx={{ pt: 1 }}>
                          <Button
                            variant="contained"
                            color={
                              cancellation
                                ? "error"
                                : "primary"
                            }
                            size="small"
                            onClick={() =>
                              markAsRead(
                                notification
                              )
                            }
                            disabled={
                              markingRead ===
                              notification.id
                            }
                            sx={{
                              textTransform:
                                "none",
                              borderRadius:
                                1.5,
                            }}
                          >
                            {markingRead ===
                            notification.id ? (
                              <CircularProgress
                                size={18}
                                color="inherit"
                              />
                            ) : (
                              "Mark as Read"
                            )}
                          </Button>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            }
          )}
        </Stack>
      )}
    </Box>
  );
}

export default Notifications;
