import { useEffect, useMemo, useState } from "react";
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
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";

const API_BASE_URL = "http://127.0.0.1:8000";

interface Resource {
  id: number;
  name: string;
  resource_code: string;
  description: string | null;
  quantity: number;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      const response = await axios.get<Resource[]>(
        `${API_BASE_URL}/resources`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResources(
        Array.isArray(response.data) ? response.data : []
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
            "Unable to load resources."
        );
      } else {
        setError("Unable to load resources.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const filteredResources = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return resources;
    }

    return resources.filter((resource) => {
      return (
        resource.name.toLowerCase().includes(value) ||
        resource.resource_code.toLowerCase().includes(value) ||
        (resource.description || "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [resources, search]);

  const availableCount = resources.filter(
    (resource) => resource.is_available
  ).length;

  const unavailableCount =
    resources.length - availableCount;

  const totalQuantity = resources.reduce(
    (total, resource) => total + resource.quantity,
    0
  );

  return (
    <Box>
      {/* Page Header */}
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
            <Inventory2OutlinedIcon color="primary" />

            <Typography
              variant="overline"
              color="primary"
              fontWeight={700}
              letterSpacing={1.2}
            >
              RESOURCE MANAGEMENT
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
            Resources
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Manage office equipment and monitor resource
            availability and quantities.
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{
            minHeight: 350,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress size={42} />
        </Box>
      ) : (
        <>
          {/* Statistics */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
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
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Total Resources
                      </Typography>

                      <Typography
                        variant="h3"
                        fontWeight={800}
                        sx={{ mt: 0.5 }}
                      >
                        {resources.length}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        resource types
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
                        backgroundColor: "#eaf2ff",
                        color: "primary.main",
                      }}
                    >
                      <Inventory2OutlinedIcon />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
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
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Available
                      </Typography>

                      <Typography
                        variant="h3"
                        fontWeight={800}
                        color="success.main"
                        sx={{ mt: 0.5 }}
                      >
                        {availableCount}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        currently available
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
                        backgroundColor: "#edf8ef",
                        color: "success.main",
                      }}
                    >
                      <CheckCircleOutlineOutlinedIcon />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
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
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Unavailable
                      </Typography>

                      <Typography
                        variant="h3"
                        fontWeight={800}
                        color="error.main"
                        sx={{ mt: 0.5 }}
                      >
                        {unavailableCount}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        currently unavailable
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
                        backgroundColor: "#fff0f0",
                        color: "error.main",
                      }}
                    >
                      <CancelOutlinedIcon />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
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
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Total Quantity
                      </Typography>

                      <Typography
                        variant="h3"
                        fontWeight={800}
                        color="primary"
                        sx={{ mt: 0.5 }}
                      >
                        {totalQuantity}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        items available
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
                        backgroundColor: "#f3efff",
                        color: "#6f42c1",
                      }}
                    >
                      <InventoryOutlinedIcon />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Search */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <TextField
                fullWidth
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by resource name, code, or description..."
                InputProps={{
                  startAdornment: (
                    <SearchOutlinedIcon
                      sx={{
                        mr: 1,
                        color: "text.secondary",
                      }}
                    />
                  ),
                }}
              />
            </CardContent>
          </Card>

          {/* Resources */}
          {filteredResources.length === 0 ? (
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <CardContent sx={{ py: 6, textAlign: "center" }}>
                <Inventory2OutlinedIcon
                  sx={{
                    fontSize: 48,
                    color: "text.disabled",
                    mb: 1,
                  }}
                />

                <Typography
                  variant="h6"
                  fontWeight={700}
                >
                  No resources found
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Try changing your search.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {filteredResources.map((resource) => (
                <Grid
                  key={resource.id}
                  size={{ xs: 12, md: 6, xl: 4 }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      borderRadius: 4,
                      border: "1px solid",
                      borderColor: "divider",
                      overflow: "hidden",
                      transition:
                        "transform 0.2s ease, box-shadow 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow:
                          "0 12px 30px rgba(15, 23, 42, 0.10)",
                      },
                    }}
                  >
                    {/* Card Header */}
                    <Box
                      sx={{
                        px: 3,
                        py: 2.5,
                        background:
                          "linear-gradient(135deg, #eef5ff 0%, #f8fbff 100%)",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        spacing={2}
                      >
                        <Box>
                          <Typography
                            variant="h6"
                            fontWeight={800}
                          >
                            {resource.name}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            {resource.resource_code}
                          </Typography>
                        </Box>

                        <Chip
                          icon={
                            resource.is_available ? (
                              <CheckCircleOutlineOutlinedIcon />
                            ) : (
                              <CancelOutlinedIcon />
                            )
                          }
                          label={
                            resource.is_available
                              ? "Available"
                              : "Unavailable"
                          }
                          color={
                            resource.is_available
                              ? "success"
                              : "error"
                          }
                          size="small"
                        />
                      </Stack>
                    </Box>

                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2.5}>
                        {/* Quantity */}
                        <Box
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
                            alignItems="center"
                          >
                            <Stack
                              direction="row"
                              spacing={1.2}
                              alignItems="center"
                            >
                              <Box
                                sx={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 2,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: "#eaf2ff",
                                  color: "primary.main",
                                }}
                              >
                                <InventoryOutlinedIcon fontSize="small" />
                              </Box>

                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Total Quantity
                                </Typography>

                                <Typography
                                  variant="body1"
                                  fontWeight={700}
                                >
                                  {resource.quantity} items
                                </Typography>
                              </Box>
                            </Stack>

                            <Typography
                              variant="h5"
                              fontWeight={800}
                              color="primary"
                            >
                              {resource.quantity}
                            </Typography>
                          </Stack>
                        </Box>

                        <Divider />

                        {/* Description */}
                        <Box>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ mb: 1 }}
                          >
                            <DescriptionOutlinedIcon
                              sx={{
                                fontSize: 20,
                                color: "text.secondary",
                              }}
                            />

                            <Typography
                              variant="subtitle2"
                              fontWeight={700}
                            >
                              Description
                            </Typography>
                          </Stack>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              lineHeight: 1.7,
                            }}
                          >
                            {resource.description ||
                              "No description available."}
                          </Typography>
                        </Box>

                        <Divider />

                        {/* Footer */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Resource ID: {resource.id}
                          </Typography>

                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Inventory2OutlinedIcon />}
                            onClick={() => {
                              // Resource detail/assignment flow
                              // will be connected later.
                            }}
                          >
                            View Resource
                          </Button>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
}

export default Resources;