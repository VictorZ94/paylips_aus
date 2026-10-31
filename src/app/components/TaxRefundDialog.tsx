"use client";

import { memo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { palette } from "../theme";
import { fmtAud, fmtDate, isoToday } from "../../lib/format";
import { addTaxRefund, deleteTaxRefund } from "../../lib/tax-refunds";
import type { TaxRefund } from "../../lib/types";

export const TaxRefundDialog = memo(function TaxRefundDialog({
  open,
  onClose,
  refunds,
}: {
  open: boolean;
  onClose: () => void;
  refunds: TaxRefund[];
}) {
  const [date, setDate] = useState(isoToday);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const parsed = Number(amount);
  const valid = date !== "" && amount !== "" && Number.isFinite(parsed) && parsed > 0;

  const onAdd = () => {
    if (!valid) return;
    void addTaxRefund({
      date,
      amount: Math.round(parsed * 100) / 100,
      note: note.trim(),
    });
    setAmount("");
    setNote("");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            backgroundColor: palette.surface,
            border: `1px solid ${palette.borderHi}`,
          },
        },
      }}
    >
      <DialogTitle sx={{ color: palette.text, fontWeight: 600 }}>
        Tax refunds
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: palette.textMute, fontSize: 13, mb: 2 }}>
          Record refunds from your tax return. They are subtracted from tax
          withheld in whichever window contains the date received.
        </Typography>

        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            onAdd();
          }}
          sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
        >
          <Stack direction="row" spacing={1.25}>
            <TextField
              label="Date received"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              size="small"
              slotProps={{
                inputLabel: { shrink: true },
                input: { inputProps: { max: isoToday() } },
              }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Amount (AUD)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              size="small"
              slotProps={{ input: { inputProps: { min: 0, step: "0.01" } } }}
              sx={{ flex: 1 }}
            />
          </Stack>
          <TextField
            label="Note (optional)"
            placeholder="e.g. FY 2024–25 return"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            size="small"
          />
          <Button
            type="submit"
            variant="contained"
            disabled={!valid}
            sx={{ alignSelf: "flex-end" }}
          >
            Add refund
          </Button>
        </Box>

        {refunds.length > 0 && (
          <Box
            sx={{
              mt: 2.5,
              borderTop: `1px solid ${palette.border}`,
              pt: 1.5,
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
            }}
          >
            {[...refunds].reverse().map((r) => (
              <Stack
                key={r.id}
                direction="row"
                sx={{ alignItems: "center", gap: 1.5 }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography className="tabular" sx={{ fontSize: 13, color: palette.text }}>
                    {fmtDate(r.date)}
                  </Typography>
                  {r.note && (
                    <Typography
                      noWrap
                      sx={{ fontSize: 12, color: palette.textDim }}
                    >
                      {r.note}
                    </Typography>
                  )}
                </Box>
                <Typography
                  className="tabular"
                  sx={{ fontSize: 13, fontWeight: 600, color: palette.mint }}
                >
                  {fmtAud(r.amount)}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => void deleteTaxRefund(r.id)}
                  aria-label={`Delete refund of ${fmtAud(r.amount)} on ${fmtDate(r.date)}`}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
});
