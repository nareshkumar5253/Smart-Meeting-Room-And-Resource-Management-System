import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  CssBaseline,
  Paper,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import { useState } from "react";
import axios from "axios";

import Dashboard from "./pages/Dashboard";
import MeetingRooms from "./pages/MeetingRooms";
import Resources from "./pages/Resources";
import MainLayout from "./components/MainLayout";
import Bookings from "./pages/Bookings";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import Users from "./pages/Users";

const API_BASE_URL = "http://127.0.0.1:8000";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    background: {
      default: "#f4f7fb",
    },
  },
  typography: {
    fontFamily: "Inter, Arial, sans-serif",
  },
  shape: {
    borderRadius: 12,
  },
});

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: email.trim(),
        password,
      });

      const accessToken = response.data?.access_token;

      if (!accessToken) {
        setError("Login succeeded, but no access token was returned.");
        return;
      }

      localStorage.setItem("access_token", accessToken);

      navigate("/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail =
          err.response?.data?.detail ||
          "Login failed. Please check your email and password.";

        setError(detail);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #eef5ff 0%, #f8fbff 50%, #edf2f7 100%)",
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
          }}
        >
          <Stack spacing={3}>
            <Box textAlign="center">
              <Typography
                variant="h4"
                fontWeight={700}
                color="primary"
                gutterBottom
              >
                Smart Meeting Room
              </Typography>

              <Typography variant="body1" color="text.secondary">
                Resource Management System
              </Typography>
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Sign In
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Sign in to manage meeting rooms, resources and bookings.
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleLogin();
                }
              }}
            />

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleLogin}
              disabled={loading}
              sx={{
                py: 1.4,
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign In"
              )}
            </Button>

            <Typography
              variant="caption"
              textAlign="center"
              color="text.secondary"
            >
              Smart Meeting Room & Resource Management System
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Protected Application Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          <Route
            path="/meeting-rooms"
            element={<MeetingRooms />}
          />

          <Route
            path="/resources"
            element={<Resources />}
          />

          <Route
            path="/bookings"
            element={<Bookings />}
          />

          <Route
            path="/notifications"
            element={<Notifications />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/users"
            element={<Users />}
          />
        </Route>

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;