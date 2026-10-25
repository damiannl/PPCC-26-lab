import { makeStyles, tokens } from "@fluentui/react-components";

export const useStyles = makeStyles({
  page: {
    padding: tokens.spacingHorizontalXXL,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXL,
  },
  details: {
    display: "flex",
    flexDirection: "column",
  },
  inline: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  headerExtras: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalM,
  },
  linkedProduct: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
  },
  linkedProductImage: {
    width: "44px",
    height: "44px",
    flexShrink: 0,
    objectFit: "contain",
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  linkedProductText: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  linkedProductName: {
    maxWidth: "180px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  name: {
    fontWeight: tokens.fontWeightSemibold,
  },
  muted: {
    color: tokens.colorNeutralForeground3,
  },
  skeletonTitle: {
    width: "200px",
    height: "32px",
  },
  skeletonCards: {
    height: "128px",
  },
  skeletonTable: {
    height: "256px",
  },
});

