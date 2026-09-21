
import { useCallback, useEffect, useRef, useState } from "react";

import {
  AppBar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";

import { Outlet, useNavigate } from "react-router-dom";

import Sidebar from "./Sidebar";

const DRAWER_WIDTH = 250;
const API_BASE_URL = "http://127.0.0.1:8000";

interface Notification {
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

function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [notificationAnchor, setNotificationAnchor] =
    useState<null | HTMLElement>(null);

  const navigate = useNavigate();

  // Prevent state updates after component unmounts
  const isMountedRef = useRef(true);

  // Prevent multiple notification requests at the same time
  const fetchingRef = useRef(false);

  // ============================================================
  // FETCH NOTIFICATIONS
  // ============================================================

  const fetchNotifications = useCallback(async () => {
    if (fetchingRef.current) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      return;
    }

    fetchingRef.current = true;

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("access_token");

          if (isMountedRef.current) {
            window.location.href = "/";
          }

          return;
        }

        console.error(
          "Notification API error:",
          response.status
        );

        return;
      }

      const data: Notification[] =
        await response.json();

      if (isMountedRef.current) {
        setNotifications(data || []);
      }
    } catch (error) {
      console.error(
        "Notification fetch error:",
        error
      );
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // ============================================================
  // LOAD NOTIFICATIONS
  // ============================================================

  useEffect(() => {
    isMountedRef.current = true;

    fetchNotifications();

    // Refresh every 30 seconds instead of every 5 seconds.
    const interval = window.setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      isMountedRef.current = false;
      window.clearInterval(interval);
    };
  }, [fetchNotifications]);

  // ============================================================
  // UNREAD COUNT
  // ============================================================

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  // ============================================================
  // OPEN NOTIFICATION MENU
  // ============================================================

  const handleNotificationOpen = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    setNotificationAnchor(event.currentTarget);
  };

  // ============================================================
  // CLOSE NOTIFICATION MENU
  // ============================================================

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  // ============================================================
  // MARK NOTIFICATION AS READ
  // ============================================================

  const markAsRead = async (
    notificationId: number
  ) => {
    try {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_read: true,
          }),
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to mark notification as read"
        );

        return;
      }

      // Immediately update the notification locally.
      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                is_read: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.error(
        "Mark notification error:",
        error
      );
    }
  };

  // ============================================================
  // OPEN FULL NOTIFICATION PAGE
  // ============================================================

  const openNotificationsPage = () => {
    handleNotificationClose();
    navigate("/notifications");
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/";
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      {/* ========================================================
          SIDEBAR
      ======================================================== */}

      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ========================================================
          MAIN AREA
      ======================================================== */}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: {
            xs: "100%",
            md: `calc(100% - ${DRAWER_WIDTH}px)`,
          },
          minHeight: "100vh",
          backgroundColor: "#f4f7fb",
        }}
      >
        {/* ======================================================
            HEADER
        ====================================================== */}

        <AppBar
          position="sticky"
          color="inherit"
          elevation={1}
          sx={{
            backgroundColor: "#ffffff",
          }}
        >
          <Toolbar>
            {/* MOBILE MENU */}

            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{
                mr: 2,
                display: {
                  xs: "flex",
                  md: "none",
                },
              }}
            >
              <MenuIcon />
            </IconButton>

            {/* TITLE */}

            <Typography
              variant="h6"
              fontWeight={700}
              color="primary"
              sx={{
                flexGrow: 1,
              }}
            >
              Smart Meeting Room
            </Typography>

            {/* ==================================================
                NOTIFICATION BELL
            ================================================== */}

            <IconButton
              onClick={handleNotificationOpen}
              sx={{
                mr: 1,
                color: "#1976d2",
              }}
              aria-label="Open notifications"
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                max={99}
                invisible={unreadCount === 0}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* ==================================================
                LOGOUT
            ================================================== */}

            <Button
              size="small"
              variant="outlined"
              onClick={handleLogout}
              sx={{
                textTransform: "none",
              }}
            >
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        {/* ======================================================
            NOTIFICATION DROPDOWN
        ====================================================== */}

        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          sx={{
            "& .MuiPaper-root": {
              width: 450,
              maxWidth: "90vw",
              maxHeight: 650,
              overflowY: "auto",
              mt: 1,
            },
          }}
        >
          {/* HEADER */}

          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography
              variant="h6"
              fontWeight={700}
            >
              Notifications
            </Typography>

            <Chip
              label={`${notifications.length} total`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>

          <Divider />

          {/* NO NOTIFICATIONS */}

          {notifications.length === 0 && (
            <Box
              sx={{
                px: 2,
                py: 3,
                textAlign: "center",
              }}
            >
              <Typography
                variant="body1"
                fontWeight={600}
              >
                No notifications
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                }}
              >
                You're all caught up.
              </Typography>
            </Box>
          )}

          {/* ====================================================
              ALL NOTIFICATIONS
          ==================================================== */}

          {notifications.map((notification) => {
            const isCancellation =
              notification.notification_type ===
              "BOOKING_CANCELLATION";

            const isConfirmation =
              notification.notification_type ===
              "BOOKING_CONFIRMATION";

            return (
              <MenuItem
                key={notification.id}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsRead(notification.id);
                  }
                }}
                sx={{
                  whiteSpace: "normal",
                  display: "block",
                  py: 1.5,
                  px: 2,

                  borderLeft: isCancellation
                    ? "4px solid #d32f2f"
                    : isConfirmation
                    ? "4px solid #2e7d32"
                    : "4px solid #1976d2",

                  backgroundColor:
                    notification.is_read
                      ? "#ffffff"
                      : "#f5f9ff",

                  "&:hover": {
                    backgroundColor: "#eef5ff",
                  },
                }}
              >
                {/* TITLE ROW */}

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    width: "100%",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    color={
                      isCancellation
                        ? "error.main"
                        : isConfirmation
                        ? "success.main"
                        : "primary.main"
                    }
                  >
                    {notification.title}
                  </Typography>

                  {!notification.is_read && (
                    <Chip
                      label="Unread"
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* MESSAGE */}

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.8,
                    lineHeight: 1.5,
                    whiteSpace: "normal",
                  }}
                >
                  {notification.message}
                </Typography>

                {/* BOOKING ID */}

                {notification.booking_id !== null && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      mt: 0.7,
                    }}
                  >
                    Booking ID: {notification.booking_id}
                  </Typography>
                )}

                {/* CREATED TIME */}

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "block",
                    mt: 0.5,
                  }}
                >
                  {new Date(
                    notification.created_at
                  ).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </Typography>
              </MenuItem>
            );
          })}

          {/* ====================================================
              FOOTER
          ==================================================== */}

          <Divider />

          <MenuItem
            onClick={openNotificationsPage}
            sx={{
              justifyContent: "center",
              color: "primary.main",
              fontWeight: 700,
              py: 1.5,
            }}
          >
            View all notifications
          </MenuItem>
        </Menu>

        {/* ======================================================
            PAGE CONTENT
        ====================================================== */}

        <Box
          sx={{
            p: {
              xs: 2,
              sm: 3,
              md: 4,
            },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default MainLayout;
