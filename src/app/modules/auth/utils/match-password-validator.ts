import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const matchPasswordsValidator = (
    passwordKey: string,
    confirmPasswordKey: string
): ValidatorFn => {
    return (group: AbstractControl): ValidationErrors | null => {
        const password = group.get(passwordKey)?.value;
        const confirm = group.get(confirmPasswordKey)?.value;
        if (password !== confirm) {
            return { passwordsDoNotMatch: true };
        }
        return null;
    };
};