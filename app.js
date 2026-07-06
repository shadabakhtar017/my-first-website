/**
 * Punjab Welding Works - Frontend Interactivity & Logic
 * Includes: Mobile nav toggle, dynamic IST shop hours status, interactive service linking, and form simulator.
 */

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initShopHoursStatus();
  initServiceQuickLinks();
  initQuoteFormSimulator();
});

/**
 * Mobile Hamburger Menu toggle
 * Bug 7 fix: isAnimating guard prevents rapid-click glitches during CSS transition.
 */
function initMobileMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");

  if (!menuToggle || !navLinks) return;

  let isAnimating = false;

  navLinks.addEventListener("transitionend", () => {
    isAnimating = false;
  });

  menuToggle.addEventListener("click", () => {
    if (isAnimating) return;
    isAnimating = true;
    menuToggle.classList.toggle("active");
    navLinks.classList.toggle("active");
  });

  // Close menu when clicking a link
  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      menuToggle.classList.remove("active");
      navLinks.classList.remove("active");
    });
  });
}

/**
 * Calculates current status (Open/Closed) based on Asia/Kolkata timezone (India)
 * and highlights the current day of the week in the timings table.
 *
 * Bug 2 fix: Uses Intl.DateTimeFormat.formatToParts() for reliable date extraction.
 * Bug 5 fix: Ripple class is only added when the shop is open.
 * Bug 6 fix: Sunday and Saturday after-hours messages are worded correctly.
 */
function initShopHoursStatus() {
  const statusContainer = document.getElementById("live-status-container");
  const statusText = document.getElementById("status-text");
  const statusDot = document.getElementById("status-indicator");

  if (!statusContainer || !statusText) return;

  try {
    // Bug 2 fix: Reliably extract hour, minute, and weekday using formatToParts
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "numeric",
      weekday: "short",
      hour12: false
    });

    const parts = formatter.formatToParts(new Date());

    let hour = 0;
    let minute = 0;
    let weekdayShort = "";

    for (const part of parts) {
      if (part.type === "hour") hour = parseInt(part.value, 10);
      if (part.type === "minute") minute = parseInt(part.value, 10);
      if (part.type === "weekday") weekdayShort = part.value;
    }

    // Map short weekday name to numeric day-of-week (0 = Sunday)
    const weekdayMap = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 };
    const dayOfWeek = weekdayMap[weekdayShort] ?? new Date().getDay();

    // Mapping numeric days to table row IDs
    const dayRowIds = [
      "day-sunday",
      "day-monday",
      "day-tuesday",
      "day-wednesday",
      "day-thursday",
      "day-friday",
      "day-saturday"
    ];

    // Highlight current day in the table
    const currentDayId = dayRowIds[dayOfWeek];
    const currentDayRow = document.getElementById(currentDayId);
    if (currentDayRow) {
      currentDayRow.classList.add("current-day");
    }

    // Determine Open/Closed status
    // Monday to Saturday: 9:00 AM to 7:00 PM (9:00 to 19:00)
    // Sunday: Closed
    let isOpen = false;
    let closingOrOpeningInfo = "";

    if (dayOfWeek === 0) {
      // Bug 6 fix: Sunday message
      isOpen = false;
      closingOrOpeningInfo = "Closed Today — Opens Monday at 9:00 AM";
    } else {
      const openTime = 9;   // 9:00 AM
      const closeTime = 19; // 7:00 PM (19:00)
      
      const currentDecimalTime = hour + (minute / 60);

      if (currentDecimalTime >= openTime && currentDecimalTime < closeTime) {
        isOpen = true;
        closingOrOpeningInfo = "Open Now (Closes at 7:00 PM)";
      } else if (currentDecimalTime < openTime) {
        isOpen = false;
        closingOrOpeningInfo = `Closed Now (Opens today at 9:00 AM)`;
      } else {
        isOpen = false;
        // Bug 6 fix: Saturday after-hours message
        if (dayOfWeek === 6) {
          closingOrOpeningInfo = "Closed Now — Opens Monday at 9:00 AM (Closed Sunday)";
        } else {
          closingOrOpeningInfo = "Closed Now (Opens tomorrow at 9:00 AM)";
        }
      }
    }

    // Apply styles and text updates
    statusContainer.className = "live-status-box " + (isOpen ? "status-open" : "status-closed");
    statusText.textContent = closingOrOpeningInfo;

    // Bug 5 fix: Only add ripple animation when shop is open
    if (statusDot) {
      if (isOpen) {
        statusDot.classList.add("ripple");
      } else {
        statusDot.classList.remove("ripple");
      }
    }

  } catch (error) {
    console.error("Error computing shop status:", error);
    statusText.textContent = "Open Mon - Sat: 9:00 AM - 7:00 PM";
  }
}

/**
 * Handle clicks on "Inquire Now" buttons under service cards.
 * Scrolls to form and pre-selects the service in the dropdown.
 */
function initServiceQuickLinks() {
  const inquireButtons = document.querySelectorAll(".service-link-cta");
  const serviceDropdown = document.getElementById("form-service");

  inquireButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const selectedService = btn.getAttribute("data-service");
      if (selectedService && serviceDropdown) {
        serviceDropdown.value = selectedService;
      }
    });
  });
}

/**
 * Interactive Quote Form simulator.
 * Intercepts form submission, shows loading state, then reveals a styled success confirmation screen.
 *
 * Bug 1 fix: Reset handler uses empty string to restore CSS default display.
 * Bug 3 fix: Proper aria-hidden removal and focus management on success panel.
 */
function initQuoteFormSimulator() {
  const form = document.getElementById("quote-form");
  const successPanel = document.getElementById("form-success");
  const submittedPhoneSpan = document.getElementById("submitted-phone");
  const resetBtn = document.getElementById("reset-form-btn");

  if (!form || !successPanel || !submittedPhoneSpan) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById("form-submit-btn");
    const nameVal = document.getElementById("form-name").value;
    const phoneVal = document.getElementById("form-phone").value;
    const serviceVal = document.getElementById("form-service").value;
    const messageVal = document.getElementById("form-message").value;

    if (!nameVal || !phoneVal || !serviceVal || !messageVal) return;

    // Show loading state on button
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting Inquiry...";
    submitBtn.style.opacity = "0.7";

    // Simulate server request delay
    setTimeout(() => {
      // Setup success content
      submittedPhoneSpan.textContent = phoneVal;
      
      // Toggle panels
      form.style.display = "none";
      successPanel.style.display = "flex";

      // Bug 3 fix: Remove aria-hidden and move focus to success panel
      successPanel.removeAttribute("aria-hidden");
      successPanel.setAttribute("tabindex", "-1");
      successPanel.focus();
      
      // Scroll to the top of the form panel for visibility
      successPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });

      // Reset loading state on button (for reset scenario)
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      submitBtn.style.opacity = "1";
    }, 1200);
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      form.reset();
      successPanel.style.display = "none";
      successPanel.setAttribute("aria-hidden", "true");
      // Bug 1 fix: Use empty string to restore CSS default display
      form.style.display = "";
    });
  }
}
