import { ErrorHandler, isDevMode } from "@angular/core";
import { AlertComponent, AlertType } from "shared/components";
import { SessionService } from "core";

export class GlobalErrorhandler implements ErrorHandler {
    enableHandler: boolean = true;
    alert: AlertComponent

    handleError(error: Error) {
        console.error(error);
        if (!isDevMode() && this.enableHandler) {
            this.alert = SessionService.getInstance().context['msgbox.alert'];
            if (this.alert) {
                this.alert.show('Unhandled Error', error.stack, AlertType.ERROR);
            }
        }
    }
}