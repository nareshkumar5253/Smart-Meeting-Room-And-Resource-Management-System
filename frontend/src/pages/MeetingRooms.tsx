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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import TvOutlinedIcon from "@mui/icons-material/TvOutlined";
import MicNoneOutlinedIcon from "@mui/icons-material/MicNoneOutlined";
import DrawOutlinedIcon from "@mui/icons-material/DrawOutlined";
import CastOutlinedIcon from "@mui/icons-material/CastOutlined";
import RestaurantOutlinedIcon from "@mui/icons-material/RestaurantOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CloseIcon from "@mui/icons-material/Close";

const API_BASE_URL = "http://127.0.0.1:8000";

interface MeetingRoom {
  id: number;
  room_code: string;
  name: string;
  location: string | null;
  is_available: boolean;
  facilities: string | null;
  capacity: number;
  created_at?: string;
  updated_at?: string;
}

interface Booking {
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

function MeetingRooms() {
  /* =========================================================
     ROOM STATE
  ========================================================= */

  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  /* =========================================================
     BOOKING STATE
  ========================================================= */

  const [bookingOpen, setBookingOpen] = useState(false);

  const [selectedRoom, setSelectedRoom] =
    useState<MeetingRoom | null>(null);

  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");

  const [bookingLoading, setBookingLoading] =
    useState(false);

  const [bookingMessage, setBookingMessage] =
    useState("");

  const [bookingSuccess, setBookingSuccess] =
    useState(false);

  /* =========================================================
     SUCCESS DIALOG
  ========================================================= */

  const [confirmationOpen, setConfirmationOpen] =
    useState(false);

  const [confirmedBooking, setConfirmedBooking] =
    useState<Booking | null>(null);

  /* =========================================================
     FETCH MEETING ROOMS
  ========================================================= */

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      const response =
        await axios.get<MeetingRoom[]>(
          `${API_BASE_URL}/meeting-rooms`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      setRooms(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          localStorage.removeItem(
            "access_token"
          );

          window.location.href = "/";
          return;
        }

        setError(
          err.response?.data?.detail ||
            "Unable to load meeting rooms."
        );
      } else {
        setError(
          "Unable to load meeting rooms."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredRooms = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return rooms;
    }

    return rooms.filter((room) => {
      return (
        room.name
          .toLowerCase()
          .includes(value) ||
        room.room_code
          .toLowerCase()
          .includes(value) ||
        (room.location || "")
          .toLowerCase()
          .includes(value) ||
        (room.facilities || "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [rooms, search]);

  /* =========================================================
     FACILITIES
  ========================================================= */

  const getFacilities = (
    facilities: string | null
  ) => {
    if (!facilities) {
      return [];
    }

    return facilities
      .split(",")
      .map((facility) =>
        facility.trim()
      )
      .filter(Boolean);
  };

  /* =========================================================
     FACILITY ICON
  ========================================================= */

  const getFacilityIcon = (
    facility: string
  ) => {
    const value =
      facility.toLowerCase();

    if (
      value.includes("projector")
    ) {
      return (
        <CastOutlinedIcon
          sx={{ fontSize: 14 }}
        />
      );
    }

    if (
      value.includes("whiteboard")
    ) {
      return (
        <DrawOutlinedIcon
          sx={{ fontSize: 14 }}
        />
      );
    }

    if (
      value.includes("video") ||
      value.includes("conference")
    ) {
      return (
        <VideocamOutlinedIcon
          sx={{ fontSize: 14 }}
        />
      );
    }

    if (
      value.includes("tv") ||
      value.includes("screen")
    ) {
      return (
        <TvOutlinedIcon
          sx={{ fontSize: 14 }}
        />
      );
    }

    if (
      value.includes("microphone") ||
      value.includes("mic")
    ) {
      return (
        <MicNoneOutlinedIcon
          sx={{ fontSize: 14 }}
        />
      );
    }

    if (
      value.includes("catering")
    ) {
      return (
        <RestaurantOutlinedIcon
          sx={{ fontSize: 14 }}
        />
      );
    }

    return (
      <MeetingRoomOutlinedIcon
        sx={{ fontSize: 14 }}
      />
    );
  };

  /* =========================================================
     OPEN BOOKING FORM
  ========================================================= */

  const handleBook = (
    room: MeetingRoom
  ) => {
    setSelectedRoom(room);

    setBookingDate("");
    setStartTime("");
    setEndTime("");
    setBookingNotes("");

    setBookingMessage("");
    setBookingSuccess(false);

    setBookingOpen(true);
  };

  /* =========================================================
     CLOSE BOOKING FORM
  ========================================================= */

  const handleCloseBooking = () => {
    if (bookingLoading) {
      return;
    }

    setBookingOpen(false);

    setSelectedRoom(null);

    setBookingDate("");
    setStartTime("");
    setEndTime("");
    setBookingNotes("");

    setBookingMessage("");
    setBookingSuccess(false);
  };

  /* =========================================================
     CONFIRM BOOKING
     
     IMPORTANT:
     This version stores the booking in localStorage.
     This gives you a working frontend booking flow.
  ========================================================= */

  const handleConfirmBooking = async () => {
    if (!selectedRoom) {
      return;
    }

    /* DATE VALIDATION */

    if (!bookingDate) {
      setBookingMessage(
        "Please select a booking date."
      );

      setBookingSuccess(false);

      return;
    }

    /* START TIME VALIDATION */

    if (!startTime) {
      setBookingMessage(
        "Please select a start time."
      );

      setBookingSuccess(false);

      return;
    }

    /* END TIME VALIDATION */

    if (!endTime) {
      setBookingMessage(
        "Please select an end time."
      );

      setBookingSuccess(false);

      return;
    }

    /* TIME VALIDATION */

    if (startTime >= endTime) {
      setBookingMessage(
        "End time must be later than start time."
      );

      setBookingSuccess(false);

      return;
    }

    try {
      setBookingLoading(true);

      setBookingMessage("");

      /* Small loading delay so the UI feels natural */

      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      /* =====================================================
         CREATE BOOKING OBJECT
      ===================================================== */

      const newBooking: Booking = {
        id: `BK-${Date.now()}`,

        room_id: selectedRoom.id,

        room_name:
          selectedRoom.name,

        room_code:
          selectedRoom.room_code,

        location:
          selectedRoom.location,

        booking_date:
          bookingDate,

        start_time:
          startTime,

        end_time:
          endTime,

        notes:
          bookingNotes,

        created_at:
          new Date().toISOString(),
      };

      /* =====================================================
         GET EXISTING BOOKINGS
      ===================================================== */

      const existingBookingsText =
        localStorage.getItem(
          "meeting_room_bookings"
        );

      const existingBookings: Booking[] =
        existingBookingsText
          ? JSON.parse(
              existingBookingsText
            )
          : [];

      /* =====================================================
         CHECK DOUBLE BOOKING
      ===================================================== */

      const conflict =
        existingBookings.some(
          (booking) => {
            if (
              booking.room_id !==
              selectedRoom.id
            ) {
              return false;
            }

            if (
              booking.booking_date !==
              bookingDate
            ) {
              return false;
            }

            /*
              Time overlap condition
            */

            return (
              startTime <
                booking.end_time &&
              endTime >
                booking.start_time
            );
          }
        );

      if (conflict) {
        setBookingMessage(
          "This room is already booked during the selected time."
        );

        setBookingSuccess(false);

        setBookingLoading(false);

        return;
      }

      /* =====================================================
         SAVE BOOKING
      ===================================================== */

      const updatedBookings = [
        ...existingBookings,
        newBooking,
      ];

      localStorage.setItem(
        "meeting_room_bookings",
        JSON.stringify(
          updatedBookings
        )
      );

      /* =====================================================
         SHOW SUCCESS
      ===================================================== */

      setConfirmedBooking(
        newBooking
      );

      setBookingSuccess(true);

      setBookingMessage(
        "Booking confirmed successfully!"
      );

      /* Close booking form */

      setTimeout(() => {
        setBookingOpen(false);

        setConfirmationOpen(true);

        setBookingLoading(false);
      }, 800);

    } catch (err) {
      console.error(
        "Booking error:",
        err
      );

      setBookingMessage(
        "Unable to create booking."
      );

      setBookingSuccess(false);

      setBookingLoading(false);
    }
  };

  /* =========================================================
     EDIT ROOM
  ========================================================= */

  const handleEdit = (
    room: MeetingRoom
  ) => {
    console.log(
      "Edit room:",
      room
    );

    alert(
      `Edit room: ${room.name}`
    );
  };

  /* =========================================================
     DELETE ROOM
  ========================================================= */

  const handleDelete = (
    room: MeetingRoom
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${room.name}"?`
      );

    if (!confirmed) {
      return;
    }

    console.log(
      "Delete room:",
      room
    );

    /*
      Connect DELETE API here later.
    */
  };

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (
    date: string
  ) => {
    if (!date) {
      return "";
    }

    const parts =
      date.split("-");

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  /* =========================================================
     RETURN UI
  ========================================================= */

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100%",
        backgroundColor: "#f4f5f9",
        px: {
          xs: 2,
          sm: 3,
          md: 4,
        },
        py: {
          xs: 2,
          md: 3,
        },
      }}
    >

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
          gap: 2,
          flexWrap: "wrap",
        }}
      >

        <Box>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 0.5 }}
          >

            <MeetingRoomOutlinedIcon
              sx={{
                color: "#176bc5",
                fontSize: 22,
              }}
            />

            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: "#176bc5",
                letterSpacing: 1,
              }}
            >
              ROOM MANAGEMENT
            </Typography>

          </Stack>

          <Typography
            sx={{
              fontSize: {
                xs: 25,
                md: 30,
              },
              fontWeight: 800,
              color: "#202124",
              lineHeight: 1.2,
            }}
          >
            Meeting Rooms
          </Typography>

          <Typography
            sx={{
              mt: 0.6,
              fontSize: 13,
              color: "#777",
            }}
          >
            Browse and book available
            meeting rooms.
          </Typography>

        </Box>


        {/* SEARCH */}

        <TextField
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search rooms..."
          size="small"
          sx={{
            width: {
              xs: "100%",
              sm: 270,
            },
            backgroundColor: "#fff",
            borderRadius: 1.5,

            "& .MuiOutlinedInput-root":
              {
                borderRadius: 1.5,
              },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">

                <SearchOutlinedIcon
                  sx={{
                    color: "#777",
                    fontSize: 20,
                  }}
                />

              </InputAdornment>
            ),
          }}
        />

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
            minHeight: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>

      ) : (

        <>

          {/* =================================================
              ROOM TITLE
          ================================================= */}

          <Box
            sx={{
              mb: 2,
            }}
          >

            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 700,
                color: "#242424",
              }}
            >
              Available Meeting Rooms
            </Typography>

            <Typography
              sx={{
                fontSize: 12,
                color: "#888",
                mt: 0.3,
              }}
            >
              {filteredRooms.length} room
              {filteredRooms.length !== 1
                ? "s"
                : ""}{" "}
              found
            </Typography>

          </Box>


          {/* =================================================
              NO ROOMS
          ================================================= */}

          {filteredRooms.length ===
          0 ? (

            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border:
                  "1px solid #e2e2e2",
                backgroundColor: "#fff",
                py: 7,
                textAlign: "center",
              }}
            >

              <MeetingRoomOutlinedIcon
                sx={{
                  fontSize: 55,
                  color: "#bbb",
                  mb: 1,
                }}
              />

              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                No meeting rooms found
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: 13,
                  color: "#888",
                }}
              >
                Try another search.
              </Typography>

            </Card>

          ) : (

            /* =================================================
               ROOM GRID
            ================================================= */

            <Grid
              container
              spacing={2.5}
            >

              {filteredRooms.map(
                (room) => {

                  const facilities =
                    getFacilities(
                      room.facilities
                    );

                  return (

                    <Grid
                      key={room.id}
                      size={{
                        xs: 12,
                        sm: 6,
                        lg: 4,
                      }}
                    >

                      <Card
                        elevation={0}
                        sx={{
                          height: "100%",
                          minHeight: 205,
                          borderRadius: 2.5,
                          backgroundColor:
                            "#fff",
                          border:
                            "1px solid #e4e4e4",
                          overflow:
                            "hidden",
                          boxShadow:
                            "0 3px 12px rgba(0,0,0,0.07)",
                          transition:
                            "transform .2s ease, box-shadow .2s ease",

                          "&:hover": {
                            transform:
                              "translateY(-2px)",
                            boxShadow:
                              "0 7px 20px rgba(0,0,0,0.10)",
                          },
                        }}
                      >

                        {/* GREEN TOP BORDER */}

                        <Box
                          sx={{
                            height: 8,
                            backgroundColor:
                              room.is_available
                                ? "#2e8538"
                                : "#c62828",
                          }}
                        />


                        <CardContent
                          sx={{
                            p: 2,

                            "&:last-child": {
                              pb: 2,
                            },
                          }}
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
                              gap: 1,
                              mb: 1,
                            }}
                          >

                            <Typography
                              sx={{
                                fontSize: 20,
                                fontWeight: 800,
                                lineHeight:
                                  1.15,
                                color:
                                  "#222",
                              }}
                            >
                              {room.name}
                            </Typography>


                            <Chip
                              label={
                                room.is_available
                                  ? "Available"
                                  : "Unavailable"
                              }
                              size="small"
                              sx={{
                                height: 25,
                                flexShrink: 0,
                                color:
                                  "#fff",
                                fontSize: 11,
                                fontWeight: 500,
                                backgroundColor:
                                  room.is_available
                                    ? "#2e8538"
                                    : "#c62828",

                                "& .MuiChip-label":
                                  {
                                    px: 1.1,
                                  },
                              }}
                            />

                          </Box>


                          {/* LOCATION */}

                          <Stack
                            direction="row"
                            spacing={0.7}
                            alignItems="center"
                            sx={{
                              mb: 0.6,
                              color: "#777",
                            }}
                          >

                            <LocationOnOutlinedIcon
                              sx={{
                                fontSize: 18,
                              }}
                            />

                            <Typography
                              sx={{
                                fontSize: 13,
                                color: "#777",
                              }}
                            >
                              {room.location ||
                                "Location not specified"}
                            </Typography>

                          </Stack>


                          {/* CAPACITY */}

                          <Stack
                            direction="row"
                            spacing={0.7}
                            alignItems="center"
                            sx={{
                              color: "#777",
                            }}
                          >

                            <PeopleOutlineOutlinedIcon
                              sx={{
                                fontSize: 18,
                              }}
                            />

                            <Typography
                              sx={{
                                fontSize: 13,
                                color: "#777",
                              }}
                            >
                              Capacity:{" "}
                              {room.capacity}
                            </Typography>

                          </Stack>


                          {/* ROOM CODE */}

                          <Typography
                            sx={{
                              fontSize: 11,
                              color: "#999",
                              mt: 0.5,
                            }}
                          >
                            Room Code:{" "}
                            {room.room_code}
                          </Typography>


                          {/* FACILITIES */}

                          {facilities.length >
                            0 && (

                            <Stack
                              direction="row"
                              spacing={0.5}
                              useFlexGap
                              flexWrap="wrap"
                              sx={{
                                mt: 1.4,
                                minHeight: 27,
                              }}
                            >

                              {facilities.map(
                                (
                                  facility,
                                  index
                                ) => (

                                  <Chip
                                    key={`${facility}-${index}`}
                                    icon={getFacilityIcon(
                                      facility
                                    )}
                                    label={
                                      facility
                                    }
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      height: 25,
                                      borderColor:
                                        "#d4d4d4",
                                      color:
                                        "#555",
                                      backgroundColor:
                                        "#fff",
                                      fontSize:
                                        10,

                                      "& .MuiChip-icon":
                                        {
                                          color:
                                            "#777",
                                          ml: 0.5,
                                        },

                                      "& .MuiChip-label":
                                        {
                                          px: 0.8,
                                        },
                                    }}
                                  />

                                )
                              )}

                            </Stack>

                          )}


                          {/* ACTIONS */}

                          <Box
                            sx={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: 1,
                              mt: 1.6,
                            }}
                          >

                            {/* BOOK NOW */}

                            <Button
                              fullWidth
                              variant="contained"
                              disabled={
                                !room.is_available
                              }
                              onClick={() =>
                                handleBook(
                                  room
                                )
                              }
                              sx={{
                                height: 34,
                                borderRadius:
                                  1.5,
                                textTransform:
                                  "none",
                                fontSize: 13,
                                fontWeight: 700,
                                backgroundColor:
                                  "#176bc5",

                                "&:hover":
                                  {
                                    backgroundColor:
                                      "#125da9",
                                  },

                                "&.Mui-disabled":
                                  {
                                    backgroundColor:
                                      "#c7c7c7",
                                    color:
                                      "#fff",
                                  },
                              }}
                            >
                              {room.is_available
                                ? "Book Now"
                                : "Unavailable"}
                            </Button>


                            {/* EDIT */}

                            <IconButton
                              onClick={() =>
                                handleEdit(
                                  room
                                )
                              }
                              sx={{
                                width: 34,
                                height: 34,
                                color:
                                  "#666",

                                "&:hover":
                                  {
                                    backgroundColor:
                                      "#f0f0f0",
                                    color:
                                      "#176bc5",
                                  },
                              }}
                            >

                              <EditOutlinedIcon
                                sx={{
                                  fontSize:
                                    19,
                                }}
                              />

                            </IconButton>


                            {/* DELETE */}

                            <IconButton
                              onClick={() =>
                                handleDelete(
                                  room
                                )
                              }
                              sx={{
                                width: 34,
                                height: 34,
                                color:
                                  "#d32f2f",

                                "&:hover":
                                  {
                                    backgroundColor:
                                      "#fff0f0",
                                  },
                              }}
                            >

                              <DeleteOutlineOutlinedIcon
                                sx={{
                                  fontSize:
                                    20,
                                }}
                              />

                            </IconButton>

                          </Box>

                        </CardContent>

                      </Card>

                    </Grid>

                  );
                }
              )}

            </Grid>

          )}

        </>

      )}


      {/* =====================================================
          BOOKING DIALOG
      ===================================================== */}

      <Dialog
        open={bookingOpen}
        onClose={
          handleCloseBooking
        }
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >

        {/* HEADER */}

        <DialogTitle
          sx={{
            fontWeight: 800,
            fontSize: 22,
            pb: 1,
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }}
        >

          <Box>
            Book Meeting Room

            {selectedRoom && (
              <Typography
                sx={{
                  display: "block",
                  fontSize: 13,
                  color: "#777",
                  fontWeight: 400,
                  mt: 0.5,
                }}
              >
                {selectedRoom.name}
              </Typography>
            )}
          </Box>


          <IconButton
            onClick={
              handleCloseBooking
            }
            disabled={
              bookingLoading
            }
          >
            <CloseIcon />
          </IconButton>

        </DialogTitle>


        <DialogContent>

          {/* ROOM INFORMATION */}

          {selectedRoom && (

            <Box
              sx={{
                backgroundColor:
                  "#f4f7fb",
                borderRadius: 2,
                p: 2,
                mb: 3,
              }}
            >

              <Stack spacing={1}>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >

                  <LocationOnOutlinedIcon
                    sx={{
                      fontSize: 19,
                      color:
                        "#176bc5",
                    }}
                  />

                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {selectedRoom.location ||
                      "Location not specified"}
                  </Typography>

                </Stack>


                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >

                  <PeopleOutlineOutlinedIcon
                    sx={{
                      fontSize: 19,
                      color:
                        "#176bc5",
                    }}
                  />

                  <Typography
                    sx={{
                      fontSize: 14,
                    }}
                  >
                    Capacity:{" "}
                    {selectedRoom.capacity}
                  </Typography>

                </Stack>


                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#888",
                  }}
                >
                  Room Code:{" "}
                  {selectedRoom.room_code}
                </Typography>

              </Stack>

            </Box>

          )}


          {/* MESSAGE */}

          {bookingMessage && (

            <Alert
              severity={
                bookingSuccess
                  ? "success"
                  : "error"
              }
              icon={
                bookingSuccess ? (
                  <CheckCircleOutlineOutlinedIcon />
                ) : undefined
              }
              sx={{
                mb: 2,
                borderRadius: 2,
              }}
            >
              {bookingMessage}
            </Alert>

          )}


          {/* DATE */}

          <TextField
            fullWidth
            type="date"
            label="Booking Date"
            value={bookingDate}
            onChange={(event) =>
              setBookingDate(
                event.target.value
              )
            }
            InputLabelProps={{
              shrink: true,
            }}
            sx={{
              mb: 2,
            }}
          />


          {/* TIME */}

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={2}
            sx={{
              mb: 2,
            }}
          >

            <TextField
              fullWidth
              type="time"
              label="Start Time"
              value={startTime}
              onChange={(event) =>
                setStartTime(
                  event.target.value
                )
              }
              InputLabelProps={{
                shrink: true,
              }}
            />


            <TextField
              fullWidth
              type="time"
              label="End Time"
              value={endTime}
              onChange={(event) =>
                setEndTime(
                  event.target.value
                )
              }
              InputLabelProps={{
                shrink: true,
              }}
            />

          </Stack>


          {/* NOTES */}

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Meeting Notes"
            placeholder="Enter meeting purpose or notes..."
            value={bookingNotes}
            onChange={(event) =>
              setBookingNotes(
                event.target.value
              )
            }
          />

        </DialogContent>


        {/* BUTTONS */}

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            gap: 1,
          }}
        >

          <Button
            variant="outlined"
            onClick={
              handleCloseBooking
            }
            disabled={
              bookingLoading
            }
            sx={{
              textTransform:
                "none",
              borderRadius: 1.5,
            }}
          >
            Cancel
          </Button>


          <Button
            variant="contained"
            onClick={
              handleConfirmBooking
            }
            disabled={
              bookingLoading
            }
            sx={{
              textTransform:
                "none",
              borderRadius: 1.5,
              backgroundColor:
                "#176bc5",
              minWidth: 160,

              "&:hover": {
                backgroundColor:
                  "#125da9",
              },
            }}
          >

            {bookingLoading ? (

              <CircularProgress
                size={21}
                sx={{
                  color: "#fff",
                }}
              />

            ) : (

              "Confirm Booking"

            )}

          </Button>

        </DialogActions>

      </Dialog>


      {/* =====================================================
          BOOKING SUCCESS DIALOG
      ===================================================== */}

      <Dialog
        open={confirmationOpen}
        onClose={() =>
          setConfirmationOpen(
            false
          )
        }
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >

        <DialogContent
          sx={{
            textAlign: "center",
            py: 4,
          }}
        >

          {/* SUCCESS ICON */}

          <Box
            sx={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              backgroundColor:
                "#eaf7ed",
              color: "#2e8538",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              mx: "auto",
              mb: 2,
            }}
          >

            <CheckCircleOutlineOutlinedIcon
              sx={{
                fontSize: 46,
              }}
            />

          </Box>


          <Typography
            sx={{
              fontSize: 23,
              fontWeight: 800,
              color: "#222",
            }}
          >
            Booking Confirmed!
          </Typography>


          {confirmedBooking && (

            <>

              <Typography
                sx={{
                  mt: 1,
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {confirmedBooking.room_name}
              </Typography>


              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: 13,
                  color: "#777",
                }}
              >
                {confirmedBooking.location}
              </Typography>


              <Box
                sx={{
                  mt: 2.5,
                  backgroundColor:
                    "#f5f7fa",
                  borderRadius: 2,
                  p: 2,
                  textAlign:
                    "left",
                }}
              >

                <Typography
                  sx={{
                    fontSize: 13,
                    mb: 1,
                  }}
                >
                  <strong>
                    Date:
                  </strong>{" "}
                  {formatDate(
                    confirmedBooking.booking_date
                  )}
                </Typography>


                <Typography
                  sx={{
                    fontSize: 13,
                    mb: 1,
                  }}
                >
                  <strong>
                    Time:
                  </strong>{" "}
                  {
                    confirmedBooking.start_time
                  }{" "}
                  -{" "}
                  {
                    confirmedBooking.end_time
                  }
                </Typography>


                <Typography
                  sx={{
                    fontSize: 13,
                  }}
                >
                  <strong>
                    Booking ID:
                  </strong>{" "}
                  {confirmedBooking.id}
                </Typography>

              </Box>

            </>

          )}

        </DialogContent>


        <DialogActions
          sx={{
            justifyContent:
              "center",
            pb: 3,
          }}
        >

          <Button
            variant="contained"
            onClick={() =>
              setConfirmationOpen(
                false
              )
            }
            sx={{
              minWidth: 130,
              textTransform:
                "none",
              borderRadius: 1.5,
              backgroundColor:
                "#176bc5",

              "&:hover": {
                backgroundColor:
                  "#125da9",
              },
            }}
          >
            Done
          </Button>

        </DialogActions>

      </Dialog>

    </Box>
  );
}

export default MeetingRooms;