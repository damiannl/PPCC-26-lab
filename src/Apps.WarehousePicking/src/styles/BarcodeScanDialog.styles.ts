import { makeStyles, tokens } from "@fluentui/react-components";

export const useStyles = makeStyles({
  surface: {
    width: "min(560px, calc(100vw - 32px))",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  cameraFrame: {
    position: "relative",
    width: "100%",
    aspectRatio: "16 / 9",
    overflow: "hidden",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackgroundInverted,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  video: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  cameraMessage: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    padding: tokens.spacingHorizontalL,
    color: tokens.colorNeutralForegroundInverted,
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.66)",
  },
  barcodeRow: {
    display: "flex",
    alignItems: "end",
    gap: tokens.spacingHorizontalS,
    "@media (max-width: 480px)": {
      alignItems: "stretch",
      flexDirection: "column",
    },
  },
  barcodeField: {
    flex: 1,
    minWidth: 0,
  },
  productPreview: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalL,
    minHeight: "92px",
  },
  image: {
    width: "80px",
    height: "80px",
    flexShrink: 0,
    objectFit: "contain",
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  imagePlaceholder: {
    width: "80px",
    height: "80px",
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  productText: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    gap: tokens.spacingVerticalXS,
  },
  muted: {
    color: tokens.colorNeutralForeground3,
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
  },
});