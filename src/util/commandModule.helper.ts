import { CommandModule, InferredOptionTypes, Options } from 'yargs';

interface ArgsObj {
    [key: string]: string;
}

interface OptionsObj {
    [key: string]: Options;
}

interface ModifiedCommandModule<
    // generic to pass down inherit types
    ExtendArgs extends ArgsObj,
    ExtendOptions extends OptionsObj,
    // extend the command module but omit builder and handler to put in our inherited types
    // also omit command and describe to make them required
> extends Omit<CommandModule, 'builder' | 'handler' | 'command' | 'describe'> {
    command: string;
    describe: string;
    builder?: ExtendOptions;
    handler: (
        args: InferredOptionTypes<ExtendOptions> & ExtendArgs,
    ) => void | Promise<void>;
}

// Helper function to make use of inherited types
export const registerCommandModule = <ExtendArgs extends ArgsObj, ExtendOptions extends OptionsObj>(
    // require a module object and inherit the types
    module: ModifiedCommandModule<ExtendArgs, ExtendOptions>,
    // reexport the module because this just do some magic with parameter types
) => module;

// custom error instance to throw errors that can be ignored by options as fail or no-fail
export class HookFailedError extends Error {};
