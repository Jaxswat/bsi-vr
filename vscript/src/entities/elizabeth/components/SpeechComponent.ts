import LizComponent from "./LizComponent";
import Elizabeth from "../Elizabeth";
import {LizSpeechClip} from "../lizSpeech";
import Timer from "../../../utils/Timer";
import {PoseParamAnimationComponent, speechClipToAnimation} from "./PoseParamAnimationComponent";

export default class SpeechComponent extends LizComponent {
    private speakerEntity: CBaseEntity;
    private mouthPoseAnimComponent: PoseParamAnimationComponent;

    private speechQueue: LizSpeechClip[];
    private currentClip: LizSpeechClip | null;
    private currentClipDuration: number;
    private clipTimer: Timer;

    /**
     * The amount of time to pad the end of a clip with silence
     */
    private readonly clipPaddingSeconds: number = 0.25;

    public constructor(liz: Elizabeth) {
        super(liz);

        this.speakerEntity = Entities.CreateByClassname("info_target");
        this.speakerEntity.SetParent(this.liz.getEntity(), "mouth");
        this.speakerEntity.SetLocalOrigin( Vector(0, 0, 0) );
        this.speakerEntity.SetLocalAngles( 0, 0, 0 );
        this.mouthPoseAnimComponent = new PoseParamAnimationComponent(this.liz, "face_speak", null);

        this.speechQueue = [];
        this.currentClip = null;
        this.currentClipDuration = 0;
        this.clipTimer = new Timer(0);
    }

    public update(delta: number) {
        this.clipTimer.tick(delta);

        if (!this.clipTimer.isDone() || this.speechQueue.length === 0) {
            return;
        }

        const clip = this.speechQueue.shift()!;
        this.playClip(clip);
    }

    public updatePose(delta: number) {
        this.mouthPoseAnimComponent.updatePose(delta);
    }

    /**
     * Plays a clip immediately
     */
    public playClip(clip: LizSpeechClip) {
        if (this.currentClip !== null && !this.clipTimer.isDone()) {
            StopSoundOn(this.currentClip.assetName, this.speakerEntity);
            this.currentClip = null;
            this.currentClipDuration = 0;
        }

        this.currentClip = clip;
        EmitSoundOn(clip.assetName, this.speakerEntity);
        const clipDuration = this.speakerEntity.GetSoundDuration(clip.assetName, "");
        const waitSeconds = clipDuration + this.clipPaddingSeconds;
        this.currentClipDuration = clipDuration;
        this.clipTimer.setWaitSeconds(waitSeconds);
        this.clipTimer.reset();
        this.mouthPoseAnimComponent.setAnimation(speechClipToAnimation(clip));
    }

    /**
     * Queues a clip to be played next
     */
    public queueClip(clip: LizSpeechClip) {
        this.speechQueue.push(clip);
    }

    public clearQueue() {
        this.speechQueue = [];
    }

    public getCurrentClip(): LizSpeechClip | null {
        return this.currentClip;
    }

    public getCurrentClipDuration(): number {
        return this.currentClipDuration;
    }

    public getCurrentClipProgress(): number {
        return Math.min(this.clipTimer.getTime() / this.currentClipDuration, 1);
    }
}
