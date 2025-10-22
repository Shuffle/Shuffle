import React, { useState, useEffect, useContext, useRef } from "react";
import ReactGA from "react-ga4";

import { getTheme } from "../theme.jsx";
import {
  Box,
  Typography,
  Divider,
  Button,
  Grid,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Checkbox,
  Tooltip,
  DialogActions,
  FormControlLabel,
  Switch,
  CircularProgress,
  Skeleton,
} from "@mui/material";

import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../context/ContextApi.jsx";
import {
  ContentCopy as ContentCopyIcon,
  Draw as DrawIcon,
  Close as CloseIcon,
  Done as DoneIcon,
} from "@mui/icons-material";

// This is the main component which shows the cards on Billing & Stats tab
const LicencePopup = (props) => {
  const {
    globalUrl,
    userdata,
    serverside,
    billingInfo,
    stripeKey,
    setModalOpen,
    isScale,
    isLoggedIn,
    isMobile,
    monthlyAppRunsParent,
    monthlyAllSuborgExecutions,
    selectedOrganization,
    setSelectedOrganization,
    isCloud,
    features,
    handleGetOrg,
    licensePopup = false,
  } = props;
  //const alert = useAlert();
  let navigate = useNavigate();
  const [shuffleVariant, setShuffleVariant] = useState(isCloud ? 0 : 1);
  const [BillingEmail, setBillingEmail] = useState(
    selectedOrganization?.Billing?.Email
  );

  const { themeMode } = useContext(Context);
  const theme = getTheme(themeMode);


  useEffect(() => {
    if (selectedOrganization?.Billing?.Email !== BillingEmail) {
      setBillingEmail(selectedOrganization?.Billing?.Email);
    }
  }, [selectedOrganization]);


  const [billingCycle, setBillingCycle] = useState("annual");
  const [scaleValue, setScaleValue] = useState(
    new URLSearchParams(window.location.search).get("app_runs") ||
      userdata?.app_execution_limit / 1000 + 50 ||
      10
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setScaleValue(userdata?.app_execution_limit / 1000 + 50 || 10);
  }, [userdata]);

  // Set loading state based on data availability
  useEffect(() => {
    if (selectedOrganization && userdata) {
      // Add a small delay to show skeleton briefly for better UX
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedOrganization, userdata]);

  const getPrice = (basePrice) => {
    return Math.round(billingCycle === "annual" ? basePrice * 0.9 : basePrice); // 10% discount for annual
  };

  const stripe =
    typeof window === "undefined" || window.location === undefined
      ? ""
      : props.stripeKey === undefined
      ? ""
      : window.Stripe
      ? window.Stripe(props.stripeKey)
      : "";

  // Handle slider change for Scale plan
  const handleScaleChange = (event, newValue) => {
    setScaleValue(newValue);

    // Add app runs to URL query params
    const urlSearchParams = new URLSearchParams(window.location.search);
    urlSearchParams.set("app_runs", newValue); // Convert to actual app runs (k to actual number)
    const newUrl = `${window.location.pathname}?${urlSearchParams.toString()}`;
    window.history.replaceState({}, "", newUrl);
  };

  // Handle billing cycle change
  const handleBillingCycleChange = (event, newValue) => {
    if (newValue !== null) {
      setBillingCycle(newValue);

      if (isCloud) {
        ReactGA.event({
          category: "Billingpage",
          action: "Billing Cycle Changed",
          label: `${billingCycle} -> ${newValue}`,
        });
      }

      // Add billing cycle to URL query params
      const urlSearchParams = new URLSearchParams(window.location.search);
      urlSearchParams.set("billing_cycle", newValue);
      const newUrl = `${
        window.location.pathname
      }?${urlSearchParams.toString()}`;
      window.history.replaceState({}, "", newUrl);
    }
  };

  const payasyougo = "Pay as you go";

  const paperStyle = {
    padding: 20,
    paddingBottom: 30,
    borderRadius: theme.palette?.borderRadius,
    height: "100%",
  };

  const userInScalePlan = userdata?.app_execution_limit > 2000;

  // These functions are being used for the dynamic features from the orgSyncFeatures
  // Add this function to format the limit value
  const formatLimit = (limit) => {
    if (limit === null || limit === undefined || limit === 0)
      return "Unlimited";
    if (typeof limit === "string" && limit.toLowerCase() === "unlimited")
      return "Unlimited";
    if (typeof limit === "number") return limit.toLocaleString();
    return limit.toString();
  };

  // Add this function to format the feature text with proper unlimited handling
  const formatFeatureText = (feature, limit) => {
    if (!feature) return "";

    // Dynamic features that use limits
    const featureMapping = {
      app_executions: (limit) => {
        const formattedLimit = formatLimit(limit);
        return `Includes ${formattedLimit} App Executions per month`;
      },
      multi_env: (limit) => {
        const formattedLimit = formatLimit(limit);
        return formattedLimit === "Unlimited"
          ? "Unlimited Environments"
          : `${formattedLimit} Environment${
              parseInt(formattedLimit) > 1 ? "s" : ""
            }`;
      },
      multi_tenant: (limit) => {
        const formattedLimit = formatLimit(limit);
        return formattedLimit === "Unlimited"
          ? "Unlimited Tenants"
          : `${formattedLimit} Tenant${
              parseInt(formattedLimit) > 1 ? "s" : ""
            }`;
      },
      multi_region: (limit) => {
        const formattedLimit = formatLimit(limit);
        return formattedLimit === "Unlimited"
          ? "Unlimited Regions"
          : `${formattedLimit} Region${
              parseInt(formattedLimit) > 1 ? "s" : ""
            }`;
      },
      webhook: (limit) => {
        const formattedLimit = formatLimit(limit);
        return formattedLimit === "Unlimited"
          ? "Unlimited Webhooks"
          : `${formattedLimit} Webhook${
              parseInt(formattedLimit) > 1 ? "s" : ""
            }`;
      },
      schedules: (limit) => {
        const formattedLimit = formatLimit(limit);
        return formattedLimit === "Unlimited"
          ? "Unlimited Schedules"
          : `${formattedLimit} Schedule${
              parseInt(formattedLimit) > 1 ? "s" : ""
            }`;
      },
      user_input: (limit) => {
        const formattedLimit = formatLimit(limit);
        return formattedLimit === "Unlimited"
          ? "Unlimited User Inputs"
          : `${formattedLimit} User Input${
              parseInt(formattedLimit) > 1 ? "s" : ""
            }`;
      },
      send_mail: (limit) => {
        const formattedLimit = formatLimit(limit);
        return formattedLimit === "Unlimited"
          ? "Unlimited Emails per month"
          : `${formattedLimit} Email${
              parseInt(formattedLimit) > 1 ? "s" : ""
            } per month`;
      },
      send_sms: (limit) => {
        const formattedLimit = formatLimit(limit);
        return formattedLimit === "Unlimited"
          ? "Unlimited SMS per month"
          : `${formattedLimit} SMS${
              parseInt(formattedLimit) > 1 ? "" : ""
            } per month`;
      },
      email_trigger: (limit) => {
        const formattedLimit = formatLimit(limit);
        return formattedLimit === "Unlimited"
          ? "Unlimited Email Triggers"
          : `${formattedLimit} Email Trigger${
              parseInt(formattedLimit) > 1 ? "s" : ""
            }`;
      },
      notifications: (limit) => {
        const formattedLimit = formatLimit(limit);
        return formattedLimit === "Unlimited"
          ? "Unlimited Notifications"
          : `${formattedLimit} Notification${
              parseInt(formattedLimit) > 1 ? "s" : ""
            }`;
      },
      workflows: (limit) => {
        const formattedLimit = formatLimit(limit);
        return formattedLimit === "Unlimited"
          ? "Unlimited Workflows"
          : `${formattedLimit} Workflow${
              parseInt(formattedLimit) > 1 ? "s" : ""
            }`;
      },
      autocomplete: (limit) => {
        const formattedLimit = formatLimit(limit);
        return formattedLimit === "Unlimited"
          ? "Unlimited Autocomplete"
          : `${formattedLimit} Autocomplete${
              parseInt(formattedLimit) > 1 ? "s" : ""
            }`;
      },
      workflow_executions: (limit) => {
        const formattedLimit = formatLimit(limit);
        return formattedLimit === "Unlimited"
          ? "Unlimited Workflow Executions"
          : `${formattedLimit} Workflow Execution${
              parseInt(formattedLimit) > 1 ? "s" : ""
            }`;
      },
      authentication: (limit) => {
        const formattedLimit = formatLimit(limit);
        return formattedLimit === "Unlimited"
          ? "Unlimited Authentication"
          : `${formattedLimit} Authentication${
              parseInt(formattedLimit) > 1 ? "s" : ""
            }`;
      },
      shuffle_gpt: (limit) => {
        const formattedLimit = formatLimit(limit);
        return formattedLimit === "Unlimited"
          ? "Unlimited Shuffle GPT"
          : `${formattedLimit} Shuffle GPT${
              parseInt(formattedLimit) > 1 ? "s" : ""
            }`;
      },
      branding: (limit) => {
        const formattedLimit = formatLimit(limit);
        return formattedLimit === "Unlimited"
          ? "Unlimited Branding"
          : `${formattedLimit} Branding${
              parseInt(formattedLimit) > 1 ? "s" : ""
            }`;
      }
    };

    try {
      // Check if we have a mapping for this feature
      const formatter = featureMapping[feature];
      if (formatter) {
        return formatter(limit);
      }

      // Default format for unknown features
      const formattedLimit = formatLimit(limit);
      return `${feature}: ${formattedLimit}`;
    } catch (error) {
      console.warn(`Error formatting feature ${feature}:`, error);
      return `${feature}: ${formatLimit(limit)}`;
    }
  };

  // Send signature request to backend
  const sendSignatureRequest = (subscription) => {
    const url = `${globalUrl}/api/v1/orgs/${selectedOrganization.id}`;

    fetch(url, {
      body: JSON.stringify({
        org_id: selectedOrganization.id,
        editing: "subscription_update",
        subscription_index: 0,
        subscription: subscription,
      }),
      mode: "cors",
      method: "POST",
      credentials: "include",
      crossDomain: true,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    })
      .then((response) => {
        if (response.status !== 200) {
          console.log("Error in response");
        }
        return response.json();
      })
      .then((responseJson) => {
        console.log("Response from signature request: ", responseJson);
        if (typeof handleGetOrg === "function") {
          handleGetOrg(selectedOrganization.id);
        }
      })
      .catch((error) => {
        console.log("Error: ", error);
      });
  };

  // Create a function to remove duplicates and merge features
  const mergeUniqueFeatures = (existingFeatures, newFeatures) => {
    // Convert arrays to Sets to remove duplicates
    const uniqueFeatures = new Set([
      ...(existingFeatures || []),
      ...(newFeatures || []),
    ]);
    return Array.from(uniqueFeatures);
  };

  // This is the dialog for editing subscription with better UX
  const EditSubscriptionDialog = ({
    open,
    onClose,
    subscription,
    globalUrl,
    selectedOrganization,
    onSaved,
  }) => {
    const initialForm = {
      name: subscription?.name || "",
      active: !!subscription?.active,
      support_level: subscription?.support_level || "",
      recurrence: subscription?.recurrence || "month",
      amount: subscription?.amount || "",
      currency: subscription?.currency || "USD",
      level: subscription?.level || "",
      limit: subscription?.limit || 0,
      startdate: subscription?.startdate || 0,
      enddate: subscription?.enddate || 0,
      cancellationdate: subscription?.cancellationdate || 0,
      features: Array.isArray(subscription?.features)
        ? subscription.features
        : [],
      eula: subscription?.eula,
      eula_signed: subscription?.eula_signed,
      eula_signed_by: subscription?.eula_signed_by,
      reference: subscription?.reference,
    };
    const [form, setForm] = useState(initialForm);

    useEffect(() => {
      if (!open) return;
      setForm(initialForm);
      setFeaturesMarkdown(featuresToMarkdown(subscription?.features));
      setErrors({});
    }, [open, subscription]);

    const handleCancel = () => {
      setForm(initialForm);
      setFeaturesMarkdown(featuresToMarkdown(subscription?.features));
      setErrors({});
      onClose?.();
    };

    const toInputDate = (epoch) => {
      if (!epoch || isNaN(epoch)) return "";
      try {
        return new Date(epoch * 1000).toISOString().slice(0, 10);
      } catch (e) {
        return "";
      }
    };
    const toEpoch = (dateStr) => {
      if (!dateStr) return 0;
      const ms = Date.parse(dateStr);
      return isNaN(ms) ? 0 : Math.floor(ms / 1000);
    };

    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Simple helper: Convert features array <-> markdown list
    const featuresToMarkdown = (arr) => {
      const list = Array.isArray(arr) ? arr : [];
      return list
        .map((line) => {
          const text = String(line || "");
          // If already looks like a list item, keep as-is
          if (/^\s*-\s+/.test(text)) return text;
          return `- ${text}`;
        })
        .join("\n");
    };

    const markdownToFeatures = (markdown) => {
      if (!markdown) return [];
      return String(markdown)
        .split("\n")
        .map((raw) => raw.replace(/\s+$/, ""))
        .filter(Boolean)
        .map((line) => {
          // Keep indentation depth of multiples of two spaces before dash
          const m = line.match(/^(\s*)-\s+(.*)$/);
          if (!m) {
            return line.trim();
          }
          const indent = m[1] || "";
          const text = m[2] || "";
          return `${indent}- ${text}`.trimEnd();
        });
    };

    const [featuresMarkdown, setFeaturesMarkdown] = useState(
      featuresToMarkdown(subscription?.features)
    );
    const featuresInputRef = useRef(null);

    // Handle tab indentation for markdown textarea
    const handleFeaturesKeyDown = (e) => {
      if (e.key !== "Tab") return;
      
      const textarea = featuresInputRef.current;
      if (!textarea) return;
      
      e.preventDefault();
      
      const { selectionStart, selectionEnd } = textarea;
      const text = featuresMarkdown;
      
      // Find the start and end of the current line(s)
      const lineStart = text.lastIndexOf("\n", selectionStart - 1) + 1;
      const lineEnd = text.indexOf("\n", selectionEnd);
      const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;
      
      // Get the selected lines
      const selectedText = text.slice(lineStart, actualLineEnd);
      const lines = selectedText.split("\n");
      
      // Apply indentation
      const indent = "  "; // 2 spaces
      const newLines = lines.map(line => {
        if (e.shiftKey) {
          // Shift+Tab: remove indentation
          if (line.startsWith(indent)) {
            return line.slice(indent.length);
          }
          if (line.startsWith(" ")) {
            return line.slice(1);
          }
          return line;
        } else {
          // Tab: add indentation
          return `${indent}${line}`;
        }
      });
      
      // Update the text
      const newText = 
        text.slice(0, lineStart) + 
        newLines.join("\n") + 
        text.slice(actualLineEnd);
      
      setFeaturesMarkdown(newText);
      
      // Update cursor position
      const indentChange = e.shiftKey ? -indent.length : indent.length;
      const newSelectionStart = Math.max(lineStart, selectionStart + indentChange);
      const newSelectionEnd = Math.max(lineStart, selectionEnd + (indentChange * lines.length));
      
      // Use requestAnimationFrame for better performance than setTimeout
      requestAnimationFrame(() => {
        try {
          textarea.selectionStart = newSelectionStart;
          textarea.selectionEnd = newSelectionEnd;
        } catch (error) {
          // Ignore selection errors
        }
      });
    };

    const validate = () => {
      const next = {};
      if (!form.name || form.name.trim().length === 0)
        next.name = "Name is required";
      if (form.amount !== "" && Number.isNaN(Number(form.amount)))
        next.amount = "Amount must be a number";
      if (form.limit !== "" && Number.isNaN(Number(form.limit)))
        next.limit = "Limit must be a number";
      if (form.startdate && form.enddate && form.enddate < form.startdate)
        next.enddate = "End date must be after start date";
      if (!form.recurrence || String(form.recurrence).trim().length === 0)
        next.recurrence = "Recurrence is required";
      setErrors(next);
      return Object.keys(next).length === 0;
    };

    const save = async () => {
      if (!validate()) return;
      setSaving(true);
      try {
        const url = `${globalUrl}/api/v1/orgs/${selectedOrganization.id}`;
        const payload = {
          org_id: selectedOrganization.id,
          editing: "subscription_update",
          subscription_index: 0,
          subscription: {
            ...form,
            // Ensure backend gets array of features
            features: markdownToFeatures(featuresMarkdown),
          },
        };
        const res = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data && data.success !== false) {
          toast.success("Subscription updated");
          onClose?.();
          onSaved?.({
            ...form,
            features: markdownToFeatures(featuresMarkdown),
          });
        } else {
          toast.error("Failed to update subscription");
        }
      } catch (e) {
        toast.error("Failed to update subscription");
      } finally {
        setSaving(false);
      }
    };

    return (
      <Dialog
        open={open}
        onClose={handleCancel}
        PaperProps={{
          style: {
            background: theme.palette.backgroundColor,
            borderRadius: 8,
            border: theme.palette.defaultBorder,
            overflow: "hidden",
            margin: 0,
            minWidth: 760,
            padding: 16,
            color: theme.palette.text.primary,
            fontFamily: theme.typography.fontFamily,
          },
        }}
      >
        <DialogTitle
          sx={{
            background: theme.palette.backgroundColor,
            borderBottom: theme.palette.defaultBorder,
            p: "16px",
            marginBottom: 2,
            color: theme.palette.text.primary,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Edit subscription
        </DialogTitle>
        <DialogContent
          sx={{
            background: theme.palette.backgroundColor,
            color: theme.palette.text.primary,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginTop: 8,
            }}
          >
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              error={!!errors.name}
              helperText={errors.name}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={!!form.active}
                  onChange={(e) =>
                    setForm((prev) => {
                      const active = e.target.checked;
                      const todayEpoch = toEpoch(
                        new Date().toISOString().slice(0, 10)
                      );
                      return {
                        ...prev,
                        active,
                        cancellationdate: active
                          ? 0
                          : prev.cancellationdate && prev.cancellationdate !== 0
                          ? prev.cancellationdate
                          : todayEpoch,
                      };
                    })
                  }
                />
              }
              label="Active"
            />

            <TextField
              label="Support level"
              value={form.support_level}
              onChange={(e) =>
                setForm({ ...form, support_level: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Recurrence (string)"
              value={form.recurrence}
              onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
              fullWidth
              error={!!errors.recurrence}
              helperText={errors.recurrence}
            />

            <TextField
              label="Amount"
              type="number"
              value={form.amount}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              }}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              fullWidth
              error={!!errors.amount}
              helperText={errors.amount || "0 for Free"}
            />

            <TextField
              label="Start date"
              type="date"
              value={toInputDate(form.startdate)}
              onChange={(e) =>
                setForm({ ...form, startdate: toEpoch(e.target.value) })
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="End date"
              type="date"
              value={toInputDate(form.enddate)}
              onChange={(e) =>
                setForm({ ...form, enddate: toEpoch(e.target.value) })
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
              error={!!errors.enddate}
              helperText={errors.enddate}
            />
            {form.active ? null : (
              <TextField
                label="Cancellation date"
                type="date"
                value={toInputDate(form.cancellationdate)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    cancellationdate: toEpoch(e.target.value),
                  })
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            )}

            <div style={{ gridColumn: "1 / span 2" }}>
              <Typography
                variant="body2"
                color="textSecondary"
                style={{ marginBottom: 6 }}
              >
                Features
              </Typography>
              <TextField
                value={featuresMarkdown}
                onChange={(e) => setFeaturesMarkdown(e.target.value)}
                placeholder={"- Feature\n  - Sub feature"}
                multiline
                minRows={8}
                fullWidth
                inputRef={featuresInputRef}
                onKeyDown={handleFeaturesKeyDown}
              />
              <div style={{ marginTop: 10 }}>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  style={{ marginBottom: 4 }}
                >
                  Preview
                </Typography>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    border: "1px solid #3a3a3a",
                    width: 350,
                    padding: 12,
                    borderRadius: 4,
                  }}
                >
                  {markdownToFeatures(featuresMarkdown).map((feat, idx) => {
                    const depth = (feat.match(/^(\s+)-\s+/) || [])[1]
                      ? Math.min(
                          3,
                          Math.floor(
                            (feat.match(/^(\s+)-\s+/) || [])[1].length / 2
                          )
                        )
                      : 0;
                    const label = String(feat).replace(/^\s*-\s+/, "");
                    return (
                      <div
                        key={`md_feat_${idx}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginLeft: depth * 16,
                        }}
                      >
                        {depth === 0 ? (
                          <DoneIcon
                            style={{ color: "#9be39b", fontSize: 18 }}
                          />
                        ) : (
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              background: "#9be39b",
                              borderRadius: 999,
                              display: "inline-block",
                            }}
                          />
                        )}
                        <Typography variant="body2">{label}</Typography>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions
          sx={{
            p: "12px 16px",
            background: theme.palette.backgroundColor,
            borderTop: theme.palette.defaultBorder,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={save}
            disabled={saving}
            sx={{ px: 4 }}
          >
            {saving ? <CircularProgress size={18} color="inherit" /> : "Update"}
          </Button>
          <Button onClick={handleCancel} disabled={saving} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Skeleton loading component for subscription cards
  const SubscriptionSkeleton = () => (
    <div
      style={{
        backgroundColor: theme.palette.cardBackgroundColor,
        padding: "2px 4px 2px 4px",
        borderRadius: theme.palette?.borderRadius,
        border: "1px solid #3a3a3a",
        minWidth: 370,
        maxWidth: 370,
        width: 370,
      }}
    >
      <div style={{ padding: 16, display: "flex", flexDirection: "column" }}>
        {/* Header skeleton */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Skeleton variant="text" width={120} height={20} />
            <Skeleton variant="text" width={80} height={16} />
          </div>
          <Skeleton variant="circular" width={32} height={32} />
        </div>

        {/* Price skeleton */}
        <div style={{ marginBottom: 20 }}>
          <Skeleton variant="text" width={80} height={32} />
        </div>

        {/* Divider */}
        <Skeleton variant="rectangular" width="100%" height={1} style={{ marginBottom: 20 }} />

        {/* App runs section skeleton */}
        <div style={{ marginBottom: 20 }}>
          <Skeleton variant="text" width={60} height={16} style={{ marginBottom: 6 }} />
          <Skeleton variant="text" width={140} height={20} style={{ marginBottom: 10 }} />
          <Skeleton variant="rectangular" width="100%" height={6} style={{ borderRadius: 6 }} />
        </div>

        {/* Features section skeleton */}
        <div style={{ marginBottom: 20 }}>
          <Skeleton variant="text" width={60} height={16} style={{ marginBottom: 6 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Skeleton variant="circular" width={18} height={18} />
                <Skeleton variant="text" width={Math.random() * 100 + 80} height={16} />
              </div>
            ))}
          </div>
        </div>

        {/* Buttons skeleton */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Skeleton variant="rectangular" width="100%" height={36} style={{ borderRadius: 4 }} />
          <Skeleton variant="rectangular" width="100%" height={36} style={{ borderRadius: 4 }} />
        </div>
      </div>
    </div>
  );

  // Actual Subscription Object
  const SubscriptionObject = (props) => {
    const {
      globalUrl,
      userdata,
      selectedOrganization,
      handleGetOrg,
      subscription,
      isLoading = false,
    } = props;

    const [signatureOpen, setSignatureOpen] = React.useState(false);
    const [tosChecked, setTosChecked] = React.useState(
      subscription?.eula_signed
    );
    // Edit subscription dialog state
    const [editOpen, setEditOpen] = React.useState(false);
    const [localSub, setLocalSub] = React.useState(subscription);
    // Keep local subscription state in sync with latest DB data
    React.useEffect(() => {
      setLocalSub(subscription);
    }, [subscription]);
    // Keep tosChecked in sync with local subscription
    React.useEffect(() => {
      setTosChecked(!!(localSub && localSub.eula_signed));
    }, [localSub && localSub.eula_signed]);
    const [newBillingEmail, setNewBillingEmail] = useState("");

    // Old function for changing billing email -> Not in use anymore
    const HandleChangeBillingEmail = (orgId) => {
      const email = newBillingEmail;
      const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!emailPattern.test(email)) {
        toast("Please enter a valid email address");
        return;
      } else {
        setNewBillingEmail(email);
      }

      toast("Updating billing email. Please Wait");

      const data = {
        org_id: orgId,
        email: newBillingEmail,
        billing: {
          email: newBillingEmail,
        },
      };

      const url = `${globalUrl}/api/v1/orgs/${orgId}/billing`;
      fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (response.status !== 200) {
            console.log("Bad status code in get org:", response.status);
          }
          return response.json();
        })
        .then((responseJson) => {
          if (responseJson.success === true) {
            toast.success("Successfully updated billing email");
            setBillingEmail(newBillingEmail);
          } else {
            toast.error("Failed to update billing email. Please try again.");
          }
        })
        .catch((error) => {
          console.log("Error getting org:", error);
        });
    };

    // Get extra features from features object
    const extraFeatures = Object.entries(features || {})
      .filter(([_, featureData]) => {
        return (
          featureData &&
          typeof featureData === "object" &&
          featureData.active === true
        );
      })
      .map(([featureName, featureData]) => {
        return formatFeatureText(featureName, featureData?.limit);
      })
      .filter(
        (feature) =>
          feature.length > 0 &&
          !feature.toLowerCase().includes("unlimited") && // Add this filter to remove "unlimited" features
          !feature.includes("App Executions per month")
      );

    const finalFeatures = mergeUniqueFeatures(localSub.features, extraFeatures);

    const usedAppRuns = Number(monthlyAppRunsParent) + Number(monthlyAllSuborgExecutions);
    const appRunsLimit = userdata?.app_execution_limit || selectedOrganization?.sync_features?.app_executions?.limit;
    const appRunsPct =
      appRunsLimit > 0
        ? Math.min(100, Math.round((usedAppRuns / appRunsLimit) * 100))
        : 0;

    const [showAllFeatures, setShowAllFeatures] = useState(false);

    // Render new Current Subscription Card UI if this is the active plan
    const visibleFeatures = (finalFeatures || []).filter(Boolean);
    const collapsed = showAllFeatures
      ? visibleFeatures
      : visibleFeatures.slice(0, 6);

    const getFeatureIndent = (text) => {
      // Count leading spaces in patterns like "  - sub item"
      const match = String(text).match(/^(\s+)-\s+/);
      if (!match) return 0;
      const spaces = match[1].length;
      return Math.min(3, Math.floor(spaces / 2));
    };

    const stripPrefix = (text) => {
      return String(text)
        .replace(/^\s*-\s+/, "")
        .trim();
    };

    const isCancelled = localSub.cancellationdate !== 0;
    const isPaidPlan = localSub.amount !== "0" || (!isCloud && localSub.name.toLowerCase().includes("enterprise") && !selectedOrganization.cloud_sync);
    const amountToshow = isPaidPlan
      ? String(localSub.currency || "").toLowerCase() === "usd"
        ? "$" + localSub?.amount
        : localSub?.currency + localSub?.amount
      : "Free";

    if (typeof window === "undefined" || window.location === undefined) {
      return null;
    }

    // Show skeleton if loading
    if (isLoading) {
      return <SubscriptionSkeleton />;
    }

    return (
      <>
        <EditSubscriptionDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          subscription={localSub}
          globalUrl={globalUrl}
          selectedOrganization={selectedOrganization}
          onSaved={(updated) => {
            // Update local card immediately for responsive UI
            setLocalSub((prev) => ({ ...prev, ...updated }));
            // Refresh organization data from server
            if (typeof handleGetOrg === "function") {
              handleGetOrg(selectedOrganization.id);
            }
          }}
        />

        {/* EULA Signature Dialog */}
        <Dialog
          open={signatureOpen}
          PaperProps={{
            style: {
              pointerEvents: "auto",
              color: "white",
              minWidth: 750,
              padding: 30,
              maxHeight: 700,
              overflowY: "auto",
              overflowX: "hidden",
              zIndex: 10012,
              background: theme.palette.backgroundColor,
              border: theme.palette.defaultBorder,
            },
          }}
        >
          <Tooltip
            title="Close window"
            placement="top"
            style={{ zIndex: 10011 }}
          >
            <IconButton
              style={{ zIndex: 5000, position: "absolute", top: 34, right: 34 }}
              onClick={(e) => {
                e.preventDefault();
                setSignatureOpen(false);
                setTosChecked(false);
              }}
            >
              <CloseIcon style={{ color: "white" }} />
            </IconButton>
          </Tooltip>
          <DialogTitle id="form-dialog-title">
            Read and Accept the EULA
          </DialogTitle>
          <DialogContent>
            <TextField
              rows={17}
              multiline
              fullWidth
              InputProps={{
                readOnly: true,
                style: {
                  fontSize: 14,
                  color: "rgba(255, 255, 255, 0.6)",
                },
              }}
              value={localSub.eula}
            />
            <Checkbox
              disabled={localSub.eula_signed}
              checked={tosChecked}
              onChange={(e) => {
                setTosChecked(e.target.checked);
              }}
              inputProps={{ "aria-label": "primary checkbox" }}
            />
            <Typography
              variant="body1"
              style={{
                display: "inline-block",
                marginLeft: 10,
                marginTop: 25,
                cursor: "pointer",
              }}
              onClick={() => {
                setTosChecked(!tosChecked);
              }}
            >
              Accept
            </Typography>
            <Typography
              variant="body2"
              style={{ display: "inline-block", marginLeft: 10 }}
              color="textSecondary"
            >
              By clicking the “accept” button, you are signing the document,
              electronically agreeing that it has the same legal validity and
              effects as a handwritten signature, and that you have the
              competent authority to represent and sign on behalf an entity.
              Need support or have questions? Contact us at support@shuffler.io.
            </Typography>

            <div style={{ display: "flex", marginTop: 25 }}>
              <Button
                variant="contained"
                color="primary"
                style={{ marginLeft: "auto" }}
                disabled={!tosChecked || localSub.eula_signed}
                onClick={() => {
                  setSignatureOpen(false);
                  setLocalSub((prev) => ({ ...prev, eula_signed: true }));
                  // Push change to backend
                  sendSignatureRequest({ ...localSub, eula_signed: true });
                  // Refresh organization data from server
                  if (typeof handleGetOrg === "function") {
                    handleGetOrg(selectedOrganization.id);
                  }
                }}
              >
                Submit
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div
          style={{
            backgroundColor: theme.palette.cardBackgroundColor,
            padding: "2px 4px 2px 4px",
            borderRadius: theme.palette?.borderRadius,
            border: "1px solid #3a3a3a",
            minWidth: 370,
            maxWidth: 370,
            width: 370,
          }}
        >
          <div
            style={{ padding: 16, display: "flex", flexDirection: "column" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Typography
                  variant="body2"
                  style={{ color: "#ff8544", lineHeight: 1.2, fontWeight: 600 }}
                >
                  {localSub.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  style={{ lineHeight: 1.2, marginTop: 4, fontSize: 13 }}
                >
                  {localSub.support_level}
                </Typography>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {/* EULA Signature Button */}
                {false && (
                  <Tooltip
                    title={
                      localSub.eula_signed
                        ? `EULA Signed by ${localSub.eula_signed_by}`
                        : "Sign EULA"
                    }
                    placement="top"
                  >
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (localSub.eula_signed && !userdata.support) {
                          return;
                        }
                        setSignatureOpen(true);
                      }}
                      style={{
                        padding: "6px",
                        color: localSub.eula_signed ? "#545454" : "#ff8544",
                        backgroundColor: localSub.eula_signed
                          ? "rgba(241, 241, 241, 0.1)"
                          : "rgba(255, 133, 68, 0.1)",
                        borderRadius: "50%",
                      }}
                    >
                      <DrawIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {isPaidPlan ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: !isCancelled
                        ? "rgba(43, 192, 126, 0.1)"
                        : "rgba(255, 82, 82, 0.1)",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        background: !isCancelled ? "#2BC07E" : "#FD4C62",
                        borderRadius: 999,
                      }}
                    />
                    <Typography
                      variant="caption"
                      style={{
                        opacity: 0.9,
                        color: !isCancelled ? "#2BC07E" : "#FD4C62",
                      }}
                    >
                      {!isCancelled ? "Active" : "Inactive"}
                    </Typography>
                  </div>
                ) : null}
              </div>
            </div>

            { ((!isCloud && selectedOrganization.cloud_sync) || isCloud) && (
              <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginTop: 14,
              }}
            >
              <Typography variant="h4" style={{ fontWeight: 600 }}>
                {amountToshow}
              </Typography>
              {isPaidPlan && (
                <Typography variant="body2" color="textSecondary">
                  /{" "}
                  {localSub.recurrence === "month"
                    ? "Monthly"
                    : localSub.recurrence === "year"
                    ? "Annual"
                    : localSub.recurrence}
                </Typography>
              )}
            </div>
            )}
            {(localSub.enddate || localSub.Enddate) && localSub.active ? (
              <Typography
                variant="caption"
                color="textSecondary"
                style={{ marginTop: (isCloud || (!isCloud && selectedOrganization.cloud_sync)) ? 2 : 8 }}
              >
                {`${
                  isPaidPlan ? "Next billing: " : "App runs resets on "
                }${new Date(
                  (localSub.enddate || localSub.Enddate) * 1000
                ).toLocaleDateString(undefined, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}`}
              </Typography>
            ) : null}

            {localSub.cancellationdate !== 0 ? (
              <Typography
                variant="caption"
                color="textSecondary"
                style={{ marginTop: 2 }}
              >
                {`Cancelled on ${new Date(
                  (localSub.cancellationdate || localSub.CancellationDate) *
                    1000
                ).toLocaleDateString(undefined, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}`}
              </Typography>
            ) : null}

            <Divider
              style={{
                marginTop: 12,
                marginBottom: isCloud || (!isCloud && selectedOrganization.cloud_sync) ? 12 : 0,
                borderColor: "#2f2f2f",
              }}
            />

            {
                (isCloud || (!isCloud && selectedOrganization.cloud_sync)) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Typography variant="body2" color="textSecondary" style={{}}>
                  App Runs
                </Typography>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <Typography
                    variant="body1"
                    style={{ minWidth: 140, fontWeight: 600 }}
                  >
                    {usedAppRuns?.toLocaleString?.() || usedAppRuns} of{" "}
                    {appRunsLimit?.toLocaleString?.() || appRunsLimit}
                  </Typography>
                  <Box sx={{ width: "100%" }}>
                    <LinearProgress
                      variant="determinate"
                      value={appRunsPct}
                      sx={{
                        height: 6,
                        borderRadius: 6,
                        backgroundColor: "#3a3a3a",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: "#ff8544",
                          borderRadius: 6,
                        },
                      }}
                    />
                  </Box>
                </div>
              </div>
              )
            }

            <div style={{ marginTop: 16, marginBottom: 8 }}>
              <Typography
                variant="body2"
                color="textSecondary"
                style={{ marginBottom: 6 }}
              >
                Included:
              </Typography>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {collapsed.map((feat, idx) => {
                  const depth = getFeatureIndent(feat);
                  const label = stripPrefix(feat);
                  return (
                    <div
                      key={`feat_${idx}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginLeft: depth * 16,
                      }}
                    >
                      {depth === 0 ? (
                        <DoneIcon style={{ color: "#9be39b", fontSize: 18 }} />
                      ) : (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            background: "#9be39b",
                            borderRadius: 999,
                            display: "inline-block",
                          }}
                        />
                      )}
                      <Typography variant="body2">{label}</Typography>
                    </div>
                  );
                })}
              </div>
              {visibleFeatures.length > 6 && (
                <Button
                  onClick={() => setShowAllFeatures(!showAllFeatures)}
                  variant="text"
                  disableElevation
                  disableRipple
                  sx={{
                    textTransform: "none",
                    padding: 0,
                    marginTop: 1,
                    minWidth: 0,
                    boxShadow: "none",
                    background: "transparent",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                    fontFamily: theme?.palette?.fontFamily,
                    "&:hover": {
                      background: "transparent",
                      textDecoration: "underline",
                      textUnderlineOffset: "4px",
                      color: theme?.palette?.primary?.main,
                    },
                  }}
                  color="primary"
                >
                  {showAllFeatures ? "Show less" : "See all..."}
                </Button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 14,
              }}
            >
              {isCloud &&
              localSub.name.toLowerCase().includes("scale") &&
              localSub?.reference &&
              localSub.reference.length > 0 ? (
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    const url = `${globalUrl}/api/v1/orgs/${selectedOrganization.id}/manage_subscription`;
                    fetch(url, {
                      method: "GET",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                    })
                      .then((r) => r.json())
                      .then((data) => {
                        if (data && data.success && data.url) {
                          window.location.href = data.url;
                        } else {
                          toast("Failed to open subscription portal");
                        }
                      })
                      .catch(() => {
                        toast("Failed to open subscription portal");
                      });
                  }}
                >
                  Manage subscription
                </Button>
              ) : null}
              {!isPaidPlan && (
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  style={{ textTransform: "none" }}
                  onClick={() => {
                    if(isCloud) {
                      navigate("/pricing?ref=cloud_billing");
                    }else {
                      window.open("https://shuffler.io/pricing?env=Self-Hosted&ref=onprem_billing", "_blank")
                    }
                  }}
                >
                  Upgrade Plan
                </Button>
              )}
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={() => {
                  if (isCloud) {
                      navigate("/contact?category=contact&ref=cloud_billing")
                  } else {
                      window.open("https://shuffler.io/contact?category=contact&ref=onprem_billing", "_blank")
                  }
                }}
                style={{ textTransform: "none" }}
              >
                Contact Us
              </Button>
              {userdata.support && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  style={{ textTransform: "none" }}
                  onClick={() => {
                    setEditOpen(true);
                  }}
                >
                  Edit subscription
                </Button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };


  return (
    <div>
      <Grid
        container
        spacing={2}
        style={{
          flexDirection: "row",
          flexWrap: "nowrap",
          borderRadius: "16px",
          display: "flex",
        }}
      >
        <Grid item maxWidth={licensePopup ? 400 : 450}>
          {isLoading ? (
            <SubscriptionSkeleton />
          ) : (
            <>
              {selectedOrganization.subscriptions !== undefined &&
              selectedOrganization.subscriptions !== null &&
              selectedOrganization.subscriptions.length > 0
                ? (selectedOrganization.subscriptions || [])
                    .slice()
                    .map((sub, index) => {
                      return (
                        <SubscriptionObject
                          key={sub.id || index}
                          index={index + 1}
                          globalUrl={globalUrl}
                          userdata={userdata}
                          serverside={serverside}
                          billingInfo={billingInfo}
                          stripeKey={stripeKey}
                          selectedOrganization={selectedOrganization}
                          subscription={sub}
                          handleGetOrg={handleGetOrg}
                          highlight={true}
                          isLoading={false}
                        />
                      );
                    })
                : null}
            </>
          )}
        </Grid>
      </Grid>
    </div>
  );
};

export default LicencePopup;
