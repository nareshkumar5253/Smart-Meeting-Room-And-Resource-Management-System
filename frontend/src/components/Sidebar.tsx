
import {
  CalendarMonth,
  Dashboard as DashboardIcon,
  MeetingRoom,
  Notifications,
  People,
  Assessment,
  Inventory2,
  Logout,
} from "@mui/icons-material";

import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

const drawerWidth = 250;

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const menuItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <DashboardIcon />,
  },
  {
    label: "Meeting Rooms",
    path: "/meeting-rooms",
    icon: <MeetingRoom />,
  },
  {
    label: "Resources",
    path: "/resources",
    icon: <Inventory2 />,
  },
  {
    label: "Bookings",
    path: "/bookings",
    icon: <CalendarMonth />,
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: <Notifications />,
  },
  {
    label: "Reports",
    path: "/reports",
    icon: <Assessment />,
  },
  {
    label: "Users",
    path: "/users",
    icon: <People />,
  },
];

function Sidebar({
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // ============================================================
  // NAVIGATION
  // ============================================================

  const handleNavigation = (path: string) => {
    navigate(path);
    onMobileClose();
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");

    navigate("/", {
      replace: true,
    });
  };

  // ============================================================
  // SIDEBAR CONTENT
  // ============================================================

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ======================================================
          BRAND
      ====================================================== */}

      <Box sx={{ p: 3 }}>
        <Typography
          variant="h6"
          fontWeight={800}
          color="primary"
        >
          Smart Meeting Room
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.5,
          }}
        >
          Resource Management
        </Typography>
      </Box>

      <Divider />

      {/* ======================================================
          MAIN MENU
      ====================================================== */}

      <List
        sx={{
          px: 1.5,
          py: 2,
        }}
      >
        {menuItems.map((item) => {
          const selected =
            location.pathname === item.path;

          return (
            <ListItemButton
              key={item.path}
              selected={selected}
              onClick={() =>
                handleNavigation(item.path)
              }
              sx={{
                mb: 0.5,
                borderRadius: 2,
                py: 1.2,

                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "primary.contrastText",

                  "& .MuiListItemIcon-root": {
                    color: "inherit",
                  },

                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                },
              }}
            >
              {/* ICON */}

              <ListItemIcon
                sx={{
                  minWidth: 42,
                  color: selected
                    ? "inherit"
                    : "text.secondary",
                }}
              >
                {item.icon}
              </ListItemIcon>

              {/* LABEL */}

              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    sx: {
                      fontWeight: selected
                        ? 700
                        : 500,
                    },
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* ======================================================
          LOGOUT
      ====================================================== */}

      <Box
        sx={{
          mt: "auto",
          p: 1.5,
        }}
      >
        <Divider
          sx={{
            mb: 1,
          }}
        />

        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            py: 1.2,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 42,
            }}
          >
            <Logout />
          </ListItemIcon>

          <ListItemText
            primary="Logout"
            slotProps={{
              primary: {
                sx: {
                  fontWeight: 600,
                },
              },
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  // ============================================================
  // SIDEBAR
  // ============================================================

  return (
    <Box
      component="nav"
      sx={{
        width: {
          md: drawerWidth,
        },
        flexShrink: {
          md: 0,
        },
      }}
    >
      {/* ======================================================
          MOBILE DRAWER
      ====================================================== */}

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: {
            xs: "block",
            md: "none",
          },

          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* ======================================================
          DESKTOP DRAWER
      ====================================================== */}

      <Drawer
        variant="permanent"
        open
        sx={{
          display: {
            xs: "none",
            md: "block",
          },

          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}

export default Sidebar;
