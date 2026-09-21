import { useEffect, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Chip,
} from "@mui/material";

const API_BASE_URL = "http://127.0.0.1:8000";

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  department_id: number | null;
  is_active: boolean;
}

interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

interface UsersResponse {
  items: User[];
  pagination: Pagination;
}

interface UpdateUserPayload {
  role_id: number;
  is_active: boolean;
}

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] =
    useState<Pagination | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [editRoleId, setEditRoleId] = useState(2);
  const [editIsActive, setEditIsActive] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async (currentPage: number) => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      const response = await axios.get<UsersResponse>(
        `${API_BASE_URL}/admin/users`,
        {
          params: {
            page: currentPage,
            page_size: pageSize,
            search: search || undefined,
            role_id: roleId ? Number(roleId) : undefined,
            is_active:
              activeFilter === ""
                ? undefined
                : activeFilter === "true",
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers(response.data.items || []);
      setPagination(response.data.pagination || null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          localStorage.removeItem("access_token");
          window.location.href = "/";
          return;
        }

        if (err.response?.status === 403) {
          setError(
            "Admin access is required to manage users."
          );
          return;
        }

        setError(
          err.response?.data?.detail ||
            "Unable to load users."
        );
      } else {
        setError("Unable to load users.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers(1);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditRoleId(user.role_id);
    setEditIsActive(user.is_active);
    setEditOpen(true);
  };

  const closeEditDialog = () => {
    if (!updating) {
      setEditOpen(false);
      setSelectedUser(null);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      setUpdating(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      const payload: UpdateUserPayload = {
        role_id: editRoleId,
        is_active: editIsActive,
      };

      await axios.put(
        `${API_BASE_URL}/admin/users/${selectedUser.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEditOpen(false);
      setSelectedUser(null);

      await fetchUsers(page);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.detail ||
            "Unable to update user."
        );
      } else {
        setError("Unable to update user.");
      }
    } finally {
      setUpdating(false);
    }
  };

  const getRoleName = (id: number) => {
    if (id === 1) return "Admin";
    if (id === 2) return "Employee";
    return `Role ${id}`;
  };

  return (
    <Box>
      <Typography
        variant="h4"
        fontWeight={700}
        gutterBottom
      >
        Users
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Manage system users, roles, and account status.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card
        elevation={2}
        sx={{
          borderRadius: 3,
          mb: 3,
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ mb: 2 }}
          >
            Search & Filter
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                label="Search"
                placeholder="Search by name or email"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>

                <Select
                  value={roleId}
                  label="Role"
                  onChange={(event) => {
                    setRoleId(event.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="1">Admin</MenuItem>
                  <MenuItem value="2">Employee</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>

                <Select
                  value={activeFilter}
                  label="Status"
                  onChange={(event) => {
                    setActiveFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="contained"
                sx={{ height: "56px" }}
                onClick={handleSearch}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <Box
          sx={{
            minHeight: 250,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary">
              No users found.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {users.map((user) => (
              <Grid
                key={user.id}
                size={{ xs: 12, md: 6, lg: 4 }}
              >
                <Card
                  elevation={2}
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                  }}
                >
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 2,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="h6"
                            fontWeight={700}
                          >
                            {user.name}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            User #{user.id}
                          </Typography>
                        </Box>

                        <Chip
                          label={
                            user.is_active
                              ? "Active"
                              : "Inactive"
                          }
                          color={
                            user.is_active
                              ? "success"
                              : "error"
                          }
                          size="small"
                        />
                      </Box>

                      <Typography variant="body2">
                        <strong>Email:</strong>{" "}
                        {user.email}
                      </Typography>

                      <Typography variant="body2">
                        <strong>Role:</strong>{" "}
                        {getRoleName(user.role_id)}
                      </Typography>

                      <Typography variant="body2">
                        <strong>Department:</strong>{" "}
                        {user.department_id ?? "Not assigned"}
                      </Typography>

                      <Box sx={{ pt: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={() =>
                            openEditDialog(user)
                          }
                        >
                          Edit User
                        </Button>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {pagination &&
            pagination.total_pages > 1 && (
              <Box
                sx={{
                  mt: 4,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Button
                  variant="outlined"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((current) => current - 1)
                  }
                >
                  Previous
                </Button>

                <Typography>
                  Page {pagination.page} of{" "}
                  {pagination.total_pages}
                </Typography>

                <Button
                  variant="outlined"
                  disabled={
                    page >= pagination.total_pages
                  }
                  onClick={() =>
                    setPage((current) => current + 1)
                  }
                >
                  Next
                </Button>
              </Box>
            )}
        </>
      )}

      <Dialog
        open={editOpen}
        onClose={closeEditDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Edit User
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={selectedUser?.name || ""}
              disabled
            />

            <TextField
              fullWidth
              label="Email"
              value={selectedUser?.email || ""}
              disabled
            />

            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>

              <Select
                value={editRoleId}
                label="Role"
                onChange={(event) =>
                  setEditRoleId(
                    Number(event.target.value)
                  )
                }
              >
                <MenuItem value={1}>
                  Admin
                </MenuItem>

                <MenuItem value={2}>
                  Employee
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>

              <Select
                value={editIsActive ? "true" : "false"}
                label="Status"
                onChange={(event) =>
                  setEditIsActive(
                    event.target.value === "true"
                  )
                }
              >
                <MenuItem value="true">
                  Active
                </MenuItem>

                <MenuItem value="false">
                  Inactive
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={closeEditDialog}
            disabled={updating}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleUpdateUser}
            disabled={updating}
          >
            {updating ? (
              <CircularProgress
                size={22}
                color="inherit"
              />
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Users;