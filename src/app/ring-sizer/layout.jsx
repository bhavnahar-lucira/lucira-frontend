/**
 * The sizer is a focused, full-viewport measuring flow: the user is holding a
 * card against the glass and following one instruction at a time. Global
 * floating chrome from the root layout (Zoho SalesIQ bubble, toast stack) sits
 * bottom-right, directly over the sticky NEXT button, and competes for taps at
 * exactly the wrong moment.
 *
 * Scoped to this route only - remove the rule if support would rather keep
 * chat reachable here.
 */
export default function RingSizerLayout({ children }) {
  return (
    <>
      <style>{`
        .zsiq_theme1, #zsiq_float, #zsiq_floatmain { display: none !important; }
        body { overscroll-behavior: none; }
      `}</style>
      {children}
    </>
  );
}
