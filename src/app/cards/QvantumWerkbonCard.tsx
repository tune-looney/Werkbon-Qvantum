import React, { useEffect, useRef, useState } from "react";
import {
  Flex,
  Input,
  LoadingButton,
  Select,
  Text,
  hubspot,
} from "@hubspot/ui-extensions";
import {
  START_FUNCTION_UID,
  assertJsonValue,
  buildStartWerkbonParameters,
  formatServerlessTransportError,
  formatWorkflowError,
  type StartWerkbonParameters,
  type StartWerkbonResponse,
  type WerkbonRecipientInput,
} from "./start-contract";

type WerkbonCardProps = {
  portalId: number;
  ticketId: number;
};

hubspot.extend<"crm.record.tab">(({ context }) => {
  return (
    <WerkbonCard
      portalId={context.portal.id}
      ticketId={context.crm.objectId}
    />
  );
});

const WerkbonCard = ({ portalId, ticketId }: WerkbonCardProps) => {
  const [monteurName, setMonteurName] = useState("");
  const [klantName, setKlantName] = useState("");
  const [klantEmail, setKlantEmail] = useState("");
  const [result, setResult] = useState<StartWerkbonResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const requestInFlight = useRef(false);
  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(klantEmail.trim());
  const formReady = Boolean(monteurName && klantName.trim() && emailValid);
  const successfulResult = result?.ok && result.status !== "NO_ENVELOPE" ? result : null;
  const showStartForm = initialized && result?.ok && result.status === "NO_ENVELOPE";

  const recipients = formReady
    ? ({
        monteurName,
        klantName: klantName.trim(),
        klantEmail: klantEmail.trim().toLowerCase(),
      } as WerkbonRecipientInput)
    : undefined;

  const runWorkflow = async (action: StartWerkbonParameters["action"]) => {
    if (requestInFlight.current || (action === "open" && !recipients)) return;
    requestInFlight.current = true;
    setLoading(true);
    setMessage(null);

    try {
      const parameters = buildStartWerkbonParameters(
        portalId,
        ticketId,
        action,
        action === "open" ? recipients : undefined,
      );
      assertJsonValue(parameters);
      const next = (await hubspot.serverless(START_FUNCTION_UID, {
        parameters,
      })) as StartWerkbonResponse;
      setResult(next);
      if (!next.ok) {
        setMessage(formatWorkflowError(next));
      } else if (next.status === "NO_ENVELOPE") {
        setMessage(null);
      } else if (next.status === "FILE_ATTACHED") {
        setMessage("Afgerond: signed PDF is gekoppeld aan dit ticket.");
      } else if (next.nextAction === "MONTEUR_SIGNING") {
        setMessage("Werkbon gereed. Open de signingpagina van de monteur.");
      } else if (next.nextAction === "KLANT_SIGNING") {
        setMessage("Monteur gereed. Geef dit apparaat aan de klant.");
      } else {
        setMessage("Handtekeningen verwerkt; controleer de Documenso-status.");
      }
    } catch (error) {
      setMessage(formatServerlessTransportError(error));
    } finally {
      requestInFlight.current = false;
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    setInitialized(false);
    setResult(null);
    setMessage(null);
    void runWorkflow("resume");
  }, [portalId, ticketId]);

  return (
    <Flex direction="column" gap="medium">
      <Text>Documenso-werkbon voor dit gecontroleerde Ticket.</Text>
      {!initialized ? <Text>Werkbonstatus laden...</Text> : null}
      {showStartForm ? (
        <Flex direction="column" gap="small">
          <Select
            label="Monteur"
            name="monteur"
            required
            placeholder="Selecteer monteur"
            value={monteurName}
            onChange={(value) => setMonteurName(String(value))}
            options={[
              { label: "Richard van den Bergh", value: "Richard van den Bergh" },
              { label: "Marco Liefhebber", value: "Marco Liefhebber" },
            ]}
          />
          <Input
            label="Klantnaam"
            name="klantnaam"
            required
            value={klantName}
            onChange={setKlantName}
          />
          <Input
            label="Klant e-mailadres"
            name="klant_email"
            required
            value={klantEmail}
            onChange={setKlantEmail}
            error={Boolean(klantEmail) && !emailValid}
            validationMessage={
              klantEmail && !emailValid ? "Vul een geldig e-mailadres in." : undefined
            }
          />
          <LoadingButton
            variant="primary"
            disabled={!formReady || loading}
            loading={loading}
            onClick={() => runWorkflow("open")}
          >
            Open werkbon
          </LoadingButton>
        </Flex>
      ) : null}

      {successfulResult ? (
        <Flex direction="column" gap="small">
          <Text>
            Status: {successfulResult.envelopeStatus}. Monteur: {successfulResult.monteur.signingStatus}.
            Klant: {successfulResult.klant.signingStatus}.
          </Text>
          {successfulResult.nextAction === "MONTEUR_SIGNING" && successfulResult.monteur.url ? (
            <LoadingButton
              variant="primary"
              href={{ url: successfulResult.monteur.url, external: true }}
            >
              Open werkbon
            </LoadingButton>
          ) : null}
          {successfulResult.nextAction === "KLANT_SIGNING" && successfulResult.klant.url ? (
            <LoadingButton
              variant="primary"
              href={{ url: successfulResult.klant.url, external: true }}
            >
              Klant laten tekenen
            </LoadingButton>
          ) : null}
          {successfulResult.nextAction !== "COMPLETE" ? (
            <LoadingButton
              variant={successfulResult.nextAction === "STATUS_CHECK" ? "primary" : "secondary"}
              disabled={loading}
              loading={loading}
              onClick={() => runWorkflow("status")}
            >
              Controleer status
            </LoadingButton>
          ) : null}
        </Flex>
      ) : null}

      {message ? <Text>{message}</Text> : null}
    </Flex>
  );
};
