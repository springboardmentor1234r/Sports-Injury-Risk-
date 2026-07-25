import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom";

import { AuthProvider } from "../context/AuthContext";
import Login from "../pages/Login";
import Register from "../pages/Register";
import MyProfile from "../pages/MyProfile";
import AthleteList from "../pages/AthleteList";
import AthleteDetail from "../pages/AthleteDetail";

// Mock the shared axios instance so no real network calls happen.
// videoListOverride lets individual tests inject a specific video list
// (e.g. one completed video) without redefining the whole mock.
let videoListOverride = null;

vi.mock("../api", () => {
  return {
    default: {
      get: vi.fn((url) => {
        if (url === "/athletes/me") {
          return Promise.resolve({ data: { id: "profile-1", user_id: "user-1", sport_type: "Football", position: "Striker", age: 22, height_cm: 180, weight_kg: 75, created_at: "2026-01-01", updated_at: "2026-01-01" } });
        }
        if (url === "/athletes") {
          return Promise.resolve({
            data: [
              { id: "profile-1", sport_type: "Football", position: "Striker", age: 22, height_cm: 180, weight_kg: 75, user: { id: "user-1", full_name: "Alex Athlete", email: "a@test.com", role: "athlete" } },
            ],
          });
        }
        if (url === "/athletes/profile-1") {
          return Promise.resolve({ data: { id: "profile-1", sport_type: "Football", position: "Striker", age: 22, height_cm: 180, weight_kg: 75, user: { full_name: "Alex Athlete" } } });
        }
        if (url.includes("/injuries")) return Promise.resolve({ data: [] });
        if (url.includes("/performance")) return Promise.resolve({ data: [] });
        if (url.includes("/assessments")) return Promise.resolve({ data: [] });
        if (url.includes("/training-load")) return Promise.resolve({ data: [] });
        if (/\/videos\/[\w-]+\/analysis/.test(url)) {
          return Promise.resolve({ data: { video: {}, joint_angles: { left_knee_angle: null }, knee_symmetry_score: null } });
        }
        if (/\/videos\/[\w-]+\/frames/.test(url)) {
          return Promise.resolve({ data: [] });
        }
        if (/\/videos\/[\w-]+\/annotated/.test(url)) {
          return Promise.resolve({ data: new Blob(["fake video bytes"]) });
        }
        if (/\/videos\/[\w-]+$/.test(url)) {
          return Promise.resolve({ data: { id: "video-1", original_filename: "clip.mp4", status: "completed", activity_type: "running", frame_count: 20, analyzed_frame_count: 18, duration_seconds: 2.0, uploaded_at: "2026-01-01" } });
        }
        if (url.includes("/videos")) {
          return Promise.resolve({ data: videoListOverride ?? [] });
        }
        return Promise.resolve({ data: [] });
      }),
      post: vi.fn(() => Promise.resolve({ data: {} })),
      put: vi.fn(() => Promise.resolve({ data: {} })),
      delete: vi.fn(() => Promise.resolve({ data: {} })),
    },
  };
});

function renderWithProviders(ui, { route = "/", path = "/", user = null } = {}) {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", "fake-token");
  } else {
    localStorage.clear();
  }
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  videoListOverride = null;
});

describe("Login page", () => {
  it("renders without crashing and shows the sign-in form", () => {
    renderWithProviders(<Login />);
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });
});

describe("Register page", () => {
  it("renders without crashing and shows all role options", () => {
    renderWithProviders(<Register />);
    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /physiotherapist/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /sports scientist/i })).toBeInTheDocument();
  });
});

describe("MyProfile page (athlete)", () => {
  const athleteUser = { id: "user-1", full_name: "Alex Athlete", email: "a@test.com", role: "athlete" };

  it("loads and displays the athlete's own profile", async () => {
    renderWithProviders(<MyProfile />, { user: athleteUser });
    await waitFor(() => expect(screen.getByText(/my profile/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getAllByText("Football").length).toBeGreaterThan(0));
  });

  it("switches to the Training Load tab and shows the log-session button (athlete can self-log)", async () => {
    renderWithProviders(<MyProfile />, { user: athleteUser });
    await waitFor(() => screen.getByText(/my profile/i));
    fireEvent.click(screen.getByText("Training Load"));
    await waitFor(() => expect(screen.getByText(/log session/i)).toBeInTheDocument());
  });

  it("switches to the Injuries tab and does NOT show a write button (athlete cannot self-log injuries)", async () => {
    renderWithProviders(<MyProfile />, { user: athleteUser });
    await waitFor(() => screen.getByText(/my profile/i));
    fireEvent.click(screen.getByText("Injuries"));
    await waitFor(() => expect(screen.getByText(/no injuries recorded/i)).toBeInTheDocument());
    expect(screen.queryByText(/log injury/i)).not.toBeInTheDocument();
  });
});

describe("AthleteList page (staff)", () => {
  const coachUser = { id: "user-2", full_name: "Cara Coach", email: "c@test.com", role: "coach" };

  it("loads and displays the athlete roster", async () => {
    renderWithProviders(<AthleteList />, { user: coachUser });
    await waitFor(() => expect(screen.getByText("Alex Athlete")).toBeInTheDocument());
    expect(screen.getByText("Football")).toBeInTheDocument();
  });

  it("filters the roster via the search box", async () => {
    renderWithProviders(<AthleteList />, { user: coachUser });
    await waitFor(() => screen.getByText("Alex Athlete"));
    fireEvent.change(screen.getByPlaceholderText(/search by name/i), { target: { value: "zzz-no-match" } });
    await waitFor(() => expect(screen.getByText(/no matches/i)).toBeInTheDocument());
  });
});

describe("AthleteDetail page (staff)", () => {
  it("physiotherapist sees the write button on Injuries but not on Performance", async () => {
    const physioUser = { id: "user-3", full_name: "Pat Physio", email: "p@test.com", role: "physiotherapist" };
    renderWithProviders(<AthleteDetail />, { route: "/athletes/profile-1", path: "/athletes/:profileId", user: physioUser });
    await waitFor(() => expect(screen.getByText("Alex Athlete")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Injuries"));
    await waitFor(() => expect(screen.getByText(/log injury/i)).toBeInTheDocument());

    fireEvent.click(screen.getByText("Performance"));
    await waitFor(() => expect(screen.getByText(/no performance data/i)).toBeInTheDocument());
    expect(screen.queryByText(/log result/i)).not.toBeInTheDocument();
  });

  it("coach sees the write button on Performance and Training Load but not Injuries", async () => {
    const coachUser = { id: "user-2", full_name: "Cara Coach", email: "c@test.com", role: "coach" };
    renderWithProviders(<AthleteDetail />, { route: "/athletes/profile-1", path: "/athletes/:profileId", user: coachUser });
    await waitFor(() => expect(screen.getByText("Alex Athlete")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Performance"));
    await waitFor(() => expect(screen.getByText(/log result/i)).toBeInTheDocument());

    fireEvent.click(screen.getByText("Injuries"));
    await waitFor(() => expect(screen.getByText(/no injuries recorded/i)).toBeInTheDocument());
    expect(screen.queryByText(/log injury/i)).not.toBeInTheDocument();
  });

  it("physiotherapist can open the injury modal and submit a new record", async () => {
    const physioUser = { id: "user-3", full_name: "Pat Physio", email: "p@test.com", role: "physiotherapist" };
    renderWithProviders(<AthleteDetail />, { route: "/athletes/profile-1", path: "/athletes/:profileId", user: physioUser });
    await waitFor(() => expect(screen.getByText("Alex Athlete")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Injuries"));
    await waitFor(() => screen.getByText(/log injury/i));
    fireEvent.click(screen.getByText(/log injury/i));

    await waitFor(() => expect(screen.getByRole("dialog", { name: /log an injury/i })).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/ACL Tear/i), { target: { value: "Grade 1 Hamstring Strain" } });
    const dateInputs = screen.getAllByDisplayValue("");
    fireEvent.change(dateInputs.find((el) => el.type === "date"), { target: { value: "2026-07-01" } });

    fireEvent.click(screen.getByRole("button", { name: /save record/i }));

    const api = (await import("../api")).default;
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      "/athletes/profile-1/injuries",
      expect.objectContaining({ injury_type: "Grade 1 Hamstring Strain", date_occurred: "2026-07-01" })
    ));
  });
});

describe("Video Analysis tab", () => {
  const athleteUser = { id: "user-1", full_name: "Alex Athlete", email: "a@test.com", role: "athlete" };
  const physioUser = { id: "user-3", full_name: "Pat Physio", email: "p@test.com", role: "physiotherapist" };

  it("athlete sees the upload button on their own Video Analysis tab", async () => {
    renderWithProviders(<MyProfile />, { user: athleteUser });
    await waitFor(() => screen.getByText(/my profile/i));
    fireEvent.click(screen.getByText("Video Analysis"));
    await waitFor(() => expect(screen.getByText(/no movement videos yet/i)).toBeInTheDocument());
    expect(screen.getByText(/upload video/i)).toBeInTheDocument();
  });

  it("opens the upload modal with an activity type selector and file input", async () => {
    renderWithProviders(<MyProfile />, { user: athleteUser });
    await waitFor(() => screen.getByText(/my profile/i));
    fireEvent.click(screen.getByText("Video Analysis"));
    await waitFor(() => screen.getByText(/upload video/i));
    fireEvent.click(screen.getByText(/upload video/i));

    await waitFor(() => expect(screen.getByRole("dialog", { name: /upload a movement video/i })).toBeInTheDocument());
    expect(screen.getByText(/activity type/i)).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /squatting/i })).toBeInTheDocument();
  });

  it("physiotherapist can also upload video for an athlete they're viewing", async () => {
    renderWithProviders(<AthleteDetail />, { route: "/athletes/profile-1", path: "/athletes/:profileId", user: physioUser });
    await waitFor(() => expect(screen.getByText("Alex Athlete")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Video Analysis"));
    await waitFor(() => expect(screen.getByText(/upload video/i)).toBeInTheDocument());
  });

  it("clicking a completed video actually opens the analysis modal and fetches its data (regression test: Card was silently dropping onClick)", async () => {
    videoListOverride = [
      { id: "video-1", original_filename: "clip.mp4", status: "completed", activity_type: "running", frame_count: 20, analyzed_frame_count: 18, duration_seconds: 2.0, uploaded_at: "2026-01-01" },
    ];
    renderWithProviders(<MyProfile />, { user: athleteUser });
    await waitFor(() => screen.getByText(/my profile/i));
    fireEvent.click(screen.getByText("Video Analysis"));
    await waitFor(() => expect(screen.getByText("clip.mp4")).toBeInTheDocument());

    const api = (await import("../api")).default;
    api.get.mockClear(); // ignore the calls made just loading the list

    fireEvent.click(screen.getByText("clip.mp4"));

    // The modal's dialog should actually appear...
    await waitFor(() => expect(screen.getByRole("dialog", { name: /clip.mp4/i })).toBeInTheDocument());

    // ...and it should have genuinely fetched all four pieces of data --
    // this is exactly what silently failed to happen when Card dropped onClick.
    await waitFor(() => {
      const calledUrls = api.get.mock.calls.map((call) => call[0]);
      expect(calledUrls.some((u) => /\/videos\/video-1$/.test(u))).toBe(true);
      expect(calledUrls.some((u) => /\/videos\/video-1\/analysis/.test(u))).toBe(true);
      expect(calledUrls.some((u) => /\/videos\/video-1\/frames/.test(u))).toBe(true);
      expect(calledUrls.some((u) => /\/videos\/video-1\/annotated/.test(u))).toBe(true);
    });
  });
});
