import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  const [trades, setTrades] = useState([]);
  const [pulling, setPulling] = useState(false);
  const [lastPull, setLastPull] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    // =====================================================
    // INITIAL LOAD
    // IMPORTANT: Dashboard initially loads ONLY 100 trades
    // =====================================================

    const loadInitialData = async () => {
      try {
        const [tradesResponse, jobsResponse] = await Promise.all([
          axios.get(`${API_URL}/api/trades?limit=100`),
          axios.get(`${API_URL}/api/jobs`)
        ]);

        if (!mounted) return;

        // Show only 100 trades initially
        setTrades(tradesResponse.data);

        console.log(
          `Initial dashboard loaded ${tradesResponse.data.length} trades`
        );

        // Load latest pull job
        if (jobsResponse.data && jobsResponse.data.length > 0) {
          const latest = jobsResponse.data[0];

          setLastPull(latest);

          // If a pull is already running when dashboard opens
          if (
            latest.status === "PENDING" ||
            latest.status === "RUNNING"
          ) {
            setPulling(true);
          } else {
            setPulling(false);
          }
        }
      } catch (err) {
        console.error("Failed to load initial data:", err);

        if (mounted) {
          setError("Unable to load dashboard data");
        }
      }
    };

    loadInitialData();

    // =====================================================
    // SOCKET.IO CONNECTION
    // =====================================================

    const socket = io(API_URL);

    socket.on("connect", () => {
      console.log("Connected to Socket.IO:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err);
    });

    // =====================================================
    // PULL COMPLETED
    // =====================================================

    socket.on("pull-completed", async (data) => {
      console.log("========================================");
      console.log("PULL COMPLETED");
      console.log("Job ID:", data.jobId);
      console.log("Records fetched:", data.recordsFetched);
      console.log("========================================");

      if (!mounted) return;

      // Stop pulling state
      setPulling(false);
      setError("");

      // Update pull information
      setLastPull((previous) => ({
        ...(previous || {}),
        id: data.jobId,
        jobId: data.jobId,
        status: "COMPLETED",
        recordsFetched: data.recordsFetched
      }));

      // ===================================================
      // IMPORTANT:
      // The pull is COMPLETE.
      // NOW fetch ALL 3000 trades.
      //
      // Do NOT use /api/trades here because backend defaults
      // to 100 when no limit is provided.
      // ===================================================

      try {
        console.log("Fetching all 3000 trades...");

        const response = await axios.get(
          `${API_URL}/api/trades?limit=3000`
        );

        if (!mounted) return;

        setTrades(response.data);

        console.log(
          `Successfully loaded ${response.data.length} trades after pull`
        );

        // Safety check
        if (response.data.length < 3000) {
          console.warn(
            `Expected 3000 trades, but received ${response.data.length}`
          );
        }
      } catch (err) {
        console.error(
          "Failed to load trades after pull:",
          err
        );

        if (mounted) {
          setError(
            "Pull completed, but failed to refresh trades"
          );
        }
      }
    });

    // =====================================================
    // TRADES UPDATED
    // =====================================================
    //
    // IMPORTANT:
    // We DO NOT need to fetch here.
    //
    // The pull-completed event already fetches the 3000
    // trades. Fetching here as well can cause unnecessary
    // duplicate requests and could overwrite the 3000 with
    // the backend default of 100.
    //
    // =====================================================

    socket.on("trades-updated", () => {
      console.log(
        "Trades updated event received."
      );

      console.log(
        "Waiting for pull-completed event to load all 3000 trades."
      );
    });

    // =====================================================
    // PULL FAILED
    // =====================================================

    socket.on("pull-failed", (data) => {
      console.error("Pull failed:", data);

      if (!mounted) return;

      setPulling(false);

      setLastPull((previous) => ({
        ...(previous || {}),
        id: data.jobId,
        jobId: data.jobId,
        status: "FAILED",
        error: data.error
      }));

      setError(
        `Trade pull failed: ${
          data.error || "Unknown error"
        }`
      );
    });

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, []);

  // =====================================================
  // START NEW PULL
  // =====================================================

  const startPull = async () => {
    try {
      setError("");

      // Immediately show Pulling...
      setPulling(true);

      console.log("========================================");
      console.log("STARTING BSE PULL");
      console.log("========================================");

      // IMPORTANT:
      // Do NOT clear trades here.
      //
      // The existing 100 trades remain visible while the
      // backend is pulling the new 3000 trades.
      //

      const response = await axios.post(
        `${API_URL}/api/pull`
      );

      console.log("Pull started:", response.data);

      // Store pending/running job information
      setLastPull(response.data);

    } catch (err) {
      console.error("Failed to start pull:", err);

      setPulling(false);

      if (err.response) {
        console.error(
          "Backend response:",
          err.response.status,
          err.response.data
        );

        setError(
          err.response.data?.message ||
          "Failed to start trade pull"
        );
      } else {
        setError("Unable to connect to backend");
      }
    }
  };

  // =====================================================
  // PULL STATUS TEXT
  // =====================================================

  const getPullStatus = () => {
    if (pulling) {
      return "Pulling...";
    }

    if (lastPull?.status === "COMPLETED") {
      return "Completed";
    }

    if (lastPull?.status === "FAILED") {
      return "Failed";
    }

    if (lastPull?.status === "PENDING") {
      return "Pending";
    }

    if (lastPull?.status === "RUNNING") {
      return "Pulling...";
    }

    return "Ready";
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="app">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="header">

        <div>
          <h1>BSE Trade Dashboard</h1>

          <p>
            Real-time trade monitoring system
          </p>
        </div>

        <div className="connection">
          <span className="status-dot"></span>
          Live
        </div>

      </header>


      <main className="container">

        {/* =================================================
            STATS
        ================================================= */}

        <section className="stats">

          {/* Trades Loaded */}

          <div className="stat-card">

            <span className="stat-label">
              Trades Loaded
            </span>

            <strong>
              {trades.length}
            </strong>

          </div>


          {/* Pull Status */}

          <div className="stat-card">

            <span className="stat-label">
              Pull Status
            </span>

            <strong
              className={
                pulling
                  ? "pulling"
                  : lastPull?.status === "FAILED"
                  ? "failed"
                  : "completed"
              }
            >
              {getPullStatus()}
            </strong>

          </div>


          {/* Data Source */}

          <div className="stat-card">

            <span className="stat-label">
              Data Source
            </span>

            <strong>
              BSE API
            </strong>

          </div>

        </section>


        {/* =================================================
            CONTROL PANEL
        ================================================= */}

        <section className="control-panel">

          <div>

            <h2>
              Trade Data
            </h2>

            <p>
              Existing trades remain available while a new
              BSE pull is running.
            </p>

          </div>


          <button
            className="pull-button"
            onClick={startPull}
            disabled={pulling}
          >

            {pulling
              ? "Pulling Trades..."
              : "Pull Latest Trades"}

          </button>

        </section>


        {/* =================================================
            ERROR MESSAGE
        ================================================= */}

        {error && (
          <div className="error">
            {error}
          </div>
        )}


        {/* =================================================
            PULLING BANNER
        ================================================= */}

        {pulling && (

          <div className="pull-banner">

            <div className="spinner"></div>

            <div>

              <strong>
                Trade pull in progress
              </strong>

              <p>
                The BSE API is processing the request.
                Existing trades remain available.
              </p>

            </div>

          </div>

        )}


        {/* =================================================
            SUCCESS BANNER
        ================================================= */}

        {!pulling &&
          lastPull?.status === "COMPLETED" && (

            <div className="success-banner">

              <strong>
                Pull completed successfully
              </strong>

              <p>
                {lastPull.recordsFetched || 0} trades
                were fetched from the BSE API.
              </p>

            </div>

        )}


        {/* =================================================
            FAILED BANNER
        ================================================= */}

        {!pulling &&
          lastPull?.status === "FAILED" && (

            <div className="error">

              <strong>
                Pull failed
              </strong>

              <p>
                {lastPull.error ||
                  "The trade pull failed."}
              </p>

            </div>

        )}


        {/* =================================================
            TRADE TABLE
        ================================================= */}

        <section className="table-container">

          <div className="table-header">

            <div>

              <h2>
                Latest Trades
              </h2>

              <p>
                {trades.length >= 3000
                  ? `Showing all ${trades.length} pulled trades`
                  : `Showing the most recent ${trades.length} trades`}
              </p>

            </div>

            <span className="live-badge">
              ● LIVE
            </span>

          </div>


          <div className="table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>
                    Trade ID
                  </th>

                  <th>
                    Client
                  </th>

                  <th>
                    Symbol
                  </th>

                  <th>
                    Quantity
                  </th>

                  <th>
                    Price
                  </th>

                  <th>
                    Timestamp
                  </th>

                </tr>

              </thead>


              <tbody>

                {trades.length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      style={{
                        textAlign: "center",
                        padding: "30px"
                      }}
                    >
                      No trades available
                    </td>

                  </tr>

                ) : (

                  trades.map((trade) => (

                    <tr
                      key={trade.id}
                    >

                      <td>
                        {trade.tradeId}
                      </td>

                      <td>
                        {trade.client}
                      </td>

                      <td>

                        <span className="symbol">
                          {trade.symbol}
                        </span>

                      </td>

                      <td>
                        {trade.quantity}
                      </td>

                      <td>

                        ₹
                        {Number(
                          trade.price
                        ).toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2
                          }
                        )}

                      </td>

                      <td>

                        {new Date(
                          trade.timestamp
                        ).toLocaleString()}

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;

