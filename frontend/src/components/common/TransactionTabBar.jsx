import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Landmark,
  Truck,
} from "lucide-react";

/**
 * Shared Top Navigation Tab Bar for Transaction & Operational pages.
 * Supports:
 * - Buy forex
 * - Sell forex
 * - Transfer money (Send / Receive dropdown)
 * - Dealer exchange (Buy / Sell dropdown)
 * - Vault/Branch Transfer
 *
 * @param {Object} props
 * @param {('BUY'|'SELL'|'TRANSFER'|'OPERATIONAL')} [props.activeTab] - Optional explicit active tab. Auto-detected from URL if omitted.
 * @param {('Send'|'Receive')} [props.transferType] - Optional explicit transfer type. Auto-detected from URL if omitted.
 * @param {Function} [props.onTabChange] - Optional callback (target: string) => void.
 */
export default function TransactionTabBar({
  activeTab: controlledActiveTab,
  transferType: controlledTransferType,
  dealerType: controlledDealerType,
  onTabChange,
  style,
  className = "",
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [transferDropdownOpen, setTransferDropdownOpen] = useState(false);
  const [dealerDropdownOpen, setDealerDropdownOpen] = useState(false);
  const [operationalDropdownOpen, setOperationalDropdownOpen] = useState(false);
  const transferDropdownRef = useRef(null);
  const dealerDropdownRef = useRef(null);
  const operationalDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        transferDropdownRef.current &&
        !transferDropdownRef.current.contains(e.target)
      ) {
        setTransferDropdownOpen(false);
      }
      if (
        dealerDropdownRef.current &&
        !dealerDropdownRef.current.contains(e.target)
      ) {
        setDealerDropdownOpen(false);
      }
      if (
        operationalDropdownRef.current &&
        !operationalDropdownRef.current.contains(e.target)
      ) {
        setOperationalDropdownOpen(false);
      }
    };
    if (transferDropdownOpen || dealerDropdownOpen || operationalDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [transferDropdownOpen, dealerDropdownOpen, operationalDropdownOpen]);

  // Dealer Exchange tab detection
  const isDealerActive = useMemo(() => {
    if (controlledActiveTab === "DEALER") return true;
    return location.pathname.includes("/dealer-exchange");
  }, [controlledActiveTab, location.pathname]);

  // Operational tab detection (Vault / Branch Transfer)
  const isOperationalActive = useMemo(() => {
    if (controlledActiveTab === "OPERATIONAL") return true;
    return (
      location.pathname.includes("/vault-transfer") ||
      location.pathname.includes("/branch-transfer")
    );
  }, [controlledActiveTab, location.pathname]);

  const operationalCurrentLabel = useMemo(() => {
    if (location.pathname.includes("/vault-transfer")) {
      return "Vault Transfer";
    }
    if (location.pathname.includes("/branch-transfer")) {
      return "Branch Transfer";
    }
    return null;
  }, [location.pathname]);

  // Determine active tab
  const resolvedActiveTab = useMemo(() => {
    if (controlledActiveTab) return controlledActiveTab.toUpperCase();
    if (isDealerActive) return "DEALER";
    if (isOperationalActive) return "OPERATIONAL";
    if (location.pathname.includes("/money-transfer")) return "TRANSFER";
    const typeParam = new URLSearchParams(location.search).get("type")?.toUpperCase();
    if (typeParam === "SELL") return "SELL";
    return "BUY";
  }, [controlledActiveTab, isDealerActive, isOperationalActive, location.pathname, location.search]);

  // Determine transfer type ("Send" or "Receive")
  const resolvedTransferType = useMemo(() => {
    if (controlledTransferType) return controlledTransferType;
    const typeParam = new URLSearchParams(location.search).get("type");
    if (typeParam && typeParam.toLowerCase() === "receive") return "Receive";
    return "Send";
  }, [controlledTransferType, location.search]);

  // Determine dealer exchange type ("Buy" or "Sell")
  const resolvedDealerType = useMemo(() => {
    if (controlledDealerType) return controlledDealerType.toUpperCase() === "SELL" ? "Sell" : "Buy";
    const typeParam = new URLSearchParams(location.search).get("type")?.toUpperCase();
    if (typeParam === "SELL") return "Sell";
    return "Buy";
  }, [controlledDealerType, location.search]);

  const clearSessionData = () => {
    sessionStorage.removeItem("customerMoneyTransferRequestPrefill");
    sessionStorage.removeItem("exchangeReceiverInfo");
    sessionStorage.removeItem("exchangeSummary");
    sessionStorage.removeItem("exchangeTransferPayload");
    sessionStorage.removeItem("exchangeCustomerImageUrl");
    sessionStorage.removeItem("exchangeCurrentStep");
    sessionStorage.removeItem("exchangeTransactionId");
    sessionStorage.removeItem("exchangeApiResponseDoc");
    sessionStorage.removeItem("exchangeInvoiceData");
    sessionStorage.removeItem("dealerCurrentStep");
    sessionStorage.removeItem("dealerReceiverInfo");
    sessionStorage.removeItem("dealerSummary");
    sessionStorage.removeItem("dealerTransferPayload");
    sessionStorage.removeItem("dealerTransactionId");
    sessionStorage.removeItem("dealerApiResponseDoc");
  };

  const handleBuyClick = (e) => {
    if (e) e.preventDefault();
    clearSessionData();
    setTransferDropdownOpen(false);
    setDealerDropdownOpen(false);
    setOperationalDropdownOpen(false);
    if (location.pathname.includes("/exchange-new")) {
      if (onTabChange) {
        onTabChange("BUY");
      }
      navigate("/exchange-new?type=BUY", { replace: true });
    } else {
      navigate("/exchange-new?type=BUY");
    }
  };

  const handleSellClick = (e) => {
    if (e) e.preventDefault();
    clearSessionData();
    setTransferDropdownOpen(false);
    setDealerDropdownOpen(false);
    setOperationalDropdownOpen(false);
    if (location.pathname.includes("/exchange-new")) {
      if (onTabChange) {
        onTabChange("SELL");
      }
      navigate("/exchange-new?type=SELL", { replace: true });
    } else {
      navigate("/exchange-new?type=SELL");
    }
  };

  const handleTransferOptionClick = (type) => {
    clearSessionData();
    setTransferDropdownOpen(false);
    setDealerDropdownOpen(false);
    setOperationalDropdownOpen(false);
    if (location.pathname.includes("/money-transfer-new")) {
      if (onTabChange) {
        onTabChange(type);
      }
      navigate(`/money-transfer-new?type=${type}`, { replace: true });
    } else {
      navigate(`/money-transfer-new?type=${type}`);
    }
  };

  const handleDealerOptionClick = (type) => {
    clearSessionData();
    setTransferDropdownOpen(false);
    setDealerDropdownOpen(false);
    setOperationalDropdownOpen(false);
    if (location.pathname.includes("/dealer-exchange")) {
      if (onTabChange) {
        onTabChange(type);
      }
      navigate(`/dealer-exchange?type=${type}`, { replace: true });
    } else {
      navigate(`/dealer-exchange?type=${type}`);
    }
  };

  const handleOperationalOptionClick = (path) => {
    clearSessionData();
    setTransferDropdownOpen(false);
    setDealerDropdownOpen(false);
    setOperationalDropdownOpen(false);
    if (location.pathname.includes(path)) {
      if (onTabChange) {
        onTabChange(path);
      }
    } else {
      navigate(path);
    }
  };

  const isTransferActive = resolvedActiveTab === "TRANSFER";

  const operationalItems = [
    {
      path: "/vault-transfer",
      label: "Vault Transfer",
      desc: "Move cash between counter and vault",
      icon: Landmark,
    },
    {
      path: "/branch-transfer",
      label: "Branch Transfer",
      desc: "Inter-branch cash and stock transfer",
      icon: Truck,
    },
  ];

  return (
    <div
      className={className}
      style={{
        display: "flex",
        justifyContent: "flex-start",
        width: "100%",
        position: "relative",
        zIndex: 20,
        minHeight: "4rem",
        ...style,
      }}
    >
      <style>{`
        .tab {
          height: 50px;
          padding: 0 28px;
          border-radius: 12px;
          font-size: var(--text-btn-lg);
          line-height: var(--text-btn-lg--line-height);
          font-weight: var(--text-btn-lg--font-weight);
          font-family: var(--font-sans);
          border: 0;
          background: transparent;
          color: var(--color-muted);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.15s ease;
          text-decoration: none;
        }
        .tab:hover {
          color: var(--color-ink);
          background: var(--color-surface-alt);
        }
        .tab.on {
          background: var(--color-brand-600) !important;
          color: #fff !important;
        }
      `}</style>
      <div
        className="flex items-center gap-2  p-2 justify-evenly"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-line)",
          borderRadius: "16px",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <Link
          to="/exchange-new?type=BUY"
          className={`tab ${resolvedActiveTab === "BUY" ? "on" : ""}`}
          onClick={handleBuyClick}
        >
          Buy forex
        </Link>

        <Link
          to="/exchange-new?type=SELL"
          className={`tab ${resolvedActiveTab === "SELL" ? "on" : ""}`}
          onClick={handleSellClick}
        >
          Sell forex
        </Link>

        {/* Dealer Exchange Dropdown Tab */}
        <div ref={dealerDropdownRef} style={{ position: "relative" }}>
          <button
            type="button"
            className={`tab ${isDealerActive ? "on" : ""}`}
            onClick={() => {
              setTransferDropdownOpen(false);
              setOperationalDropdownOpen(false);
              setDealerDropdownOpen((prev) => !prev);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <span>
              Dealer exchange
            </span>
            <ChevronDown
              size={16}
              style={{
                transform: dealerDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </button>

          {dealerDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                zIndex: 50,
                minWidth: "290px",
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-line)",
                borderRadius: "16px",
                padding: "8px",
                boxShadow: "var(--shadow-sheet)",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div
                onClick={() => handleDealerOptionClick("BUY")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  background:
                    isDealerActive && resolvedDealerType === "Buy"
                      ? "var(--color-chip)"
                      : "transparent",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!(isDealerActive && resolvedDealerType === "Buy")) {
                    e.currentTarget.style.background = "var(--color-surface-alt)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(isDealerActive && resolvedDealerType === "Buy")) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "var(--color-chip)",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--color-ink)",
                    flexShrink: 0,
                  }}
                >
                  <ArrowDownLeft size={18} />
                </div>
                <div>
                  <strong
                    style={{
                      fontSize: "14px",
                      lineHeight: "20px",
                      fontWeight: 600,
                      color: "var(--color-ink)",
                      display: "block",
                    }}
                  >
                    Buy Forex
                  </strong>
                  <span
                    style={{
                      fontSize: "13px",
                      lineHeight: "18px",
                      color: "var(--color-muted)",
                      display: "block",
                      marginTop: "2px",
                    }}
                  >
                    Purchase foreign currency from dealer
                  </span>
                </div>
              </div>

              <div
                onClick={() => handleDealerOptionClick("SELL")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  background:
                    isDealerActive && resolvedDealerType === "Sell"
                      ? "var(--color-chip)"
                      : "transparent",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!(isDealerActive && resolvedDealerType === "Sell")) {
                    e.currentTarget.style.background = "var(--color-surface-alt)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(isDealerActive && resolvedDealerType === "Sell")) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "var(--color-chip)",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--color-ink)",
                    flexShrink: 0,
                  }}
                >
                  <ArrowUpRight size={18} />
                </div>
                <div>
                  <strong
                    style={{
                      fontSize: "14px",
                      lineHeight: "20px",
                      fontWeight: 600,
                      color: "var(--color-ink)",
                      display: "block",
                    }}
                  >
                    Sell Forex
                  </strong>
                  <span
                    style={{
                      fontSize: "13px",
                      lineHeight: "18px",
                      color: "var(--color-muted)",
                      display: "block",
                      marginTop: "2px",
                    }}
                  >
                    Sell foreign currency to dealer
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transfer Money Dropdown Tab */}
        <div ref={transferDropdownRef} style={{ position: "relative" }}>
          <button
            type="button"
            className={`tab ${isTransferActive ? "on" : ""}`}
            onClick={() => {
              setDealerDropdownOpen(false);
              setOperationalDropdownOpen(false);
              setTransferDropdownOpen((prev) => !prev);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <span>
              MH Transfer money
            </span>
            <ChevronDown
              size={16}
              style={{
                transform: transferDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </button>

          {transferDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                zIndex: 50,
                minWidth: "290px",
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-line)",
                borderRadius: "16px",
                padding: "8px",
                boxShadow: "var(--shadow-sheet)",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div
                onClick={() => handleTransferOptionClick("Send")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  background:
                    isTransferActive && resolvedTransferType === "Send"
                      ? "var(--color-chip)"
                      : "transparent",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!(isTransferActive && resolvedTransferType === "Send")) {
                    e.currentTarget.style.background = "var(--color-surface-alt)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(isTransferActive && resolvedTransferType === "Send")) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "var(--color-chip)",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--color-ink)",
                    flexShrink: 0,
                  }}
                >
                  <ArrowUpRight size={18} />
                </div>
                <div>
                  <strong
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--color-ink)",
                      display: "block",
                    }}
                  >
                    Send Money
                  </strong>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--color-muted)",
                      display: "block",
                      marginTop: "2px",
                    }}
                  >
                    Customer sends money out
                  </span>
                </div>
              </div>

              <div
                onClick={() => handleTransferOptionClick("Receive")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  background:
                    isTransferActive && resolvedTransferType === "Receive"
                      ? "var(--color-chip)"
                      : "transparent",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!(isTransferActive && resolvedTransferType === "Receive")) {
                    e.currentTarget.style.background = "var(--color-surface-alt)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(isTransferActive && resolvedTransferType === "Receive")) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "var(--color-chip)",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--color-ink)",
                    flexShrink: 0,
                  }}
                >
                  <ArrowDownLeft size={18} />
                </div>
                <div>
                  <strong
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--color-ink)",
                      display: "block",
                    }}
                  >
                    Receive Money
                  </strong>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--color-muted)",
                      display: "block",
                      marginTop: "2px",
                    }}
                  >
                    Customer collects money in
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stock Transfer Dropdown Tab */}
        <div ref={operationalDropdownRef} style={{ position: "relative" }}>
          <button
            type="button"
            className={`tab ${isOperationalActive ? "on" : ""}`}
            onClick={() => {
              setTransferDropdownOpen(false);
              setDealerDropdownOpen(false);
              setOperationalDropdownOpen((prev) => !prev);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <span>
              Stock Transfer
            </span>
            <ChevronDown
              size={16}
              style={{
                transform: operationalDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </button>

          {operationalDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                zIndex: 50,
                minWidth: "290px",
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-line)",
                borderRadius: "16px",
                padding: "8px",
                boxShadow: "var(--shadow-sheet)",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {operationalItems.map((item) => {
                const Icon = item.icon;
                const isItemActive = location.pathname.includes(item.path);
                return (
                  <div
                    key={item.path}
                    onClick={() => handleOperationalOptionClick(item.path)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      background: isItemActive
                        ? "var(--color-chip)"
                        : "transparent",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isItemActive) {
                        e.currentTarget.style.background = "var(--color-surface-alt)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isItemActive) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        background: "var(--color-chip)",
                        display: "grid",
                        placeItems: "center",
                        color: "var(--color-ink)",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <strong
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "var(--color-ink)",
                          display: "block",
                        }}
                      >
                        {item.label}
                      </strong>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--color-muted)",
                          display: "block",
                          marginTop: "2px",
                        }}
                      >
                        {item.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
