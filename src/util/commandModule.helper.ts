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
    handler: (args: InferredOptionTypes<ExtendOptions> & ExtendArgs) => void | Promise<void>;
}

/**
 * Type helper function to register a command module
 * @example <caption>Minimal command registration</caption>
 * registerCommandModule()({command: 'helloWorld', describe: 'HelloWorld', handler: () => console.log('HelloWorld')});
 *
 * @example <caption>Command registration with options</caption>
 * registerCommandModule()({ command: 'helloWorld', describe: 'HelloWorld', builder: { name: { alias: 'n', type: 'string' }}, handler: (args) => console.log(`Hello ${args.name}`)});
 *
 * @example <caption>Command registration with argument</caption>
 * registerCommandModule<{ name: string }>()({ command: 'helloWorld [name]', describe: 'HelloWorld', handler: (args) => console.log(`Hello ${args.name}`)});
 *
 * @example <caption>Command registration with alias</caption>
 * registerCommandModule()({command: 'helloWorld', aliases: 'hello', describe: 'HelloWorld', handler: () => console.log('HelloWorld')});
 *
 * @example <caption>Command registration with deprecated warning</caption>
 * registerCommandModule()({command: 'helloWorld', deprecated: true, describe: 'HelloWorld', handler: () => console.log('HelloWorld')});
 */
export const registerCommandModule =
    // wrapper function to apply extend args without loosing type inheritance


        <ExtendArgs extends ArgsObj = {}>() =>
        <ExtendOptions extends OptionsObj>(
            // require a module object and inherit the types
            module: ModifiedCommandModule<ExtendArgs, ExtendOptions>,
            // reexport the module because this just do some magic with parameter types
        ) =>
            module;

// custom error instance to throw errors that can be ignored by options as fail or no-fail
export class HookFailedError extends Error {}
