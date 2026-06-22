"use client";

import { Fragment } from "react";
import { QRCodeSVG } from "qrcode.react";

import {
  labelPreviousPrice,
  labelPriceParts,
  labelQrValue,
  labelSpecs,
  labelStatus,
  labelTrim,
  labelVehicleName,
  type LabelVehicle,
} from "@/lib/label-format";

import "./esl-label.css";

export interface EslLabelCardProps {
  vehicle: LabelVehicle;
  bw?: boolean;
}

export function EslLabelCard({ vehicle, bw = false }: EslLabelCardProps) {
  const status = labelStatus(vehicle);
  const trim = labelTrim(vehicle);
  const price = labelPriceParts(vehicle);
  const previousPrice = labelPreviousPrice(vehicle);
  const specs = labelSpecs(vehicle);
  const isSold = status.kind === "sold";
  const isPriceReduced = status.kind === "price_reduced";

  const statusClass =
    isPriceReduced ? "is-alert" : status.kind === "prep" || status.kind === "other" ? "is-muted" : "";

  return (
    <div className="ep-preview-wrap">
      <div className="ep-device">
        <div className={`ep lg${bw ? " bw" : ""}${isSold ? " sold-faded" : ""}`}>
          <div className="ep-top">
            <span className={`ep-status ${statusClass}`}>
              <span className="dot" />
              {status.label}
            </span>
            {vehicle.stock_number ? (
              <span className="ep-stock">
                STOCK <strong>{vehicle.stock_number}</strong>
              </span>
            ) : null}
          </div>

          <div className="ep-name">{labelVehicleName(vehicle)}</div>
          <div className="ep-trim">{trim ?? ""}</div>

          <div className="ep-price-block">
            {isPriceReduced && previousPrice ? <div className="ep-was">{previousPrice}</div> : null}
            <div className="ep-price">
              {price.formatted === "—" ? (
                price.whole
              ) : (
                <>
                  <span className="cur">$</span>
                  {price.whole}
                </>
              )}
            </div>
          </div>

          {specs.length > 0 ? (
            <div className="ep-specs">
              {specs.map((spec, index) => (
                <Fragment key={spec}>
                  {index > 0 ? <i /> : null}
                  <span>{spec}</span>
                </Fragment>
              ))}
            </div>
          ) : (
            <div />
          )}

          <div className="ep-foot">
            <div>
              <div className="ep-vin-label">VIN</div>
              <div className="ep-vin">{vehicle.vin}</div>
            </div>
            <div className="ep-qr">
              <QRCodeSVG
                value={labelQrValue(vehicle)}
                size={68}
                level="M"
                bgColor="#f3f2ea"
                fgColor="#1c1c1e"
              />
            </div>
          </div>

          {isSold ? (
            <div className="ep-sold">
              <span>Sold</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
