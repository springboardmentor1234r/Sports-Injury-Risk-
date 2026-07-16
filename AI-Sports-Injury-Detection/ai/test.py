import cv2

video=cv2.VideoCapture("sample_videos/sample.mp4")
if not video.isOpened():
    print("Error:Cannot open video")
    exit()
print("Video opened successfully!")

frame_count=0
while True:
    success, frame=video.read()
    if not success:
        print("Video finished")
        break
    frame_count += 1
    print(f"Frame: {frame_count}")

    frame = cv2.resize(frame, (800, 450))

    print(frame.shape)
    cv2.imshow("sports video",frame)

    if cv2.waitKey(25) & 0xFF==ord("q"):
        break
video.release()
cv2.destroyAllWindows()