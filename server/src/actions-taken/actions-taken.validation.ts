export const validateActionTaken = (body: any, isPatch = false) => {
  const errors: Record<string, string> = {};

  if (!isPatch) {
    if (typeof body.description !== "string" || body.description.trim() === "") {
      errors.description = "Required and must be a valid string.";
    } else if (body.description.trim().length > 2000) {
      errors.description = "Maximum length is 2000 characters.";
    }

    if (typeof body.result !== "string" || body.result.trim() === "") {
      errors.result = "Required and must be a valid string.";
    } else if (body.result.trim().length > 2000) {
      errors.result = "Maximum length is 2000 characters.";
    }

    if (typeof body.followUpRequired !== "boolean") {
      errors.followUpRequired = "Required and must be a boolean.";
    } else if (body.followUpRequired === true) {
      if (typeof body.followUpNote !== "string" || body.followUpNote.trim() === "") {
        errors.followUpNote = "Required when follow-up is needed.";
      } else if (body.followUpNote.trim().length > 1000) {
        errors.followUpNote = "Maximum length is 1000 characters.";
      }
    }

    if (body.attachmentNotes !== undefined && body.attachmentNotes !== null) {
      if (typeof body.attachmentNotes !== "string") {
        errors.attachmentNotes = "Must be a string.";
      } else if (body.attachmentNotes.length > 1000) {
        errors.attachmentNotes = "Maximum length is 1000 characters.";
      }
    }

    if (typeof body.actionAt !== "string") {
      errors.actionAt = "Required and must be an ISO-8601 string.";
    } else {
      const d = new Date(body.actionAt);
      if (isNaN(d.getTime())) {
        errors.actionAt = "Must be a valid ISO-8601 string.";
      } else {
        const now = new Date();
        if (d.getTime() > now.getTime() + 5 * 60 * 1000) {
          errors.actionAt = "Cannot be more than 5 minutes in the future.";
        }
      }
    }
  } else {
    // PATCH
    if (!Number.isInteger(body.version) || body.version < 1) {
      errors.version = "Version is required and must be an integer >= 1.";
    }
    
    // An empty body (only version) is allowed, but we choose "reject with 422 when no updatable field is sent"
    const updatableKeys = ["description", "result", "followUpRequired", "followUpNote", "attachmentNotes", "actionAt"];
    const hasUpdatable = updatableKeys.some(k => body.hasOwnProperty(k));
    if (!hasUpdatable) {
      errors.version = "At least one updatable field must be provided.";
    }

    if (body.hasOwnProperty("description")) {
      if (typeof body.description !== "string" || body.description.trim() === "") {
        errors.description = "Must be a valid non-empty string.";
      } else if (body.description.trim().length > 2000) {
        errors.description = "Maximum length is 2000 characters.";
      }
    }

    if (body.hasOwnProperty("result")) {
      if (typeof body.result !== "string" || body.result.trim() === "") {
        errors.result = "Must be a valid non-empty string.";
      } else if (body.result.trim().length > 2000) {
        errors.result = "Maximum length is 2000 characters.";
      }
    }

    if (body.hasOwnProperty("followUpRequired")) {
      if (typeof body.followUpRequired !== "boolean") {
        errors.followUpRequired = "Must be a boolean.";
      }
    }

    // We must validate followUpNote dynamically in context of followUpRequired
    // If followUpRequired is sent as true, or not sent but we assume it might be true... wait. 
    // Spec: "if the update changes followUpRequired to true the resulting record must have a non-empty followUpNote; if it changes it to false the note is cleared."
    // This part requires checking existing record if not sent together, but let's just validate what is sent here.
    if (body.hasOwnProperty("followUpNote") && body.followUpNote !== null) {
      if (typeof body.followUpNote !== "string") {
        errors.followUpNote = "Must be a string.";
      } else if (body.followUpNote.trim().length > 1000) {
        errors.followUpNote = "Maximum length is 1000 characters.";
      } else if (body.followUpNote.trim() === "" && body.followUpRequired === true) {
         errors.followUpNote = "Required when follow-up is needed.";
      }
    }

    if (body.hasOwnProperty("attachmentNotes") && body.attachmentNotes !== null) {
      if (typeof body.attachmentNotes !== "string") {
        errors.attachmentNotes = "Must be a string.";
      } else if (body.attachmentNotes.length > 1000) {
        errors.attachmentNotes = "Maximum length is 1000 characters.";
      }
    }

    if (body.hasOwnProperty("actionAt")) {
      if (typeof body.actionAt !== "string") {
        errors.actionAt = "Must be an ISO-8601 string.";
      } else {
        const d = new Date(body.actionAt);
        if (isNaN(d.getTime())) {
          errors.actionAt = "Must be a valid ISO-8601 string.";
        } else {
          const now = new Date();
          if (d.getTime() > now.getTime() + 5 * 60 * 1000) {
            errors.actionAt = "Cannot be more than 5 minutes in the future.";
          }
        }
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
